from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Purchase, PurchaseDetail, Product, Inventory, Employee, Supplier
from datetime import datetime

purchase_bp = Blueprint("purchase", __name__)

@purchase_bp.route("", methods=["GET"])
@jwt_required()
def get_purchases():
    results = db.session.query(
        Purchase,
        Supplier.name.label("supplier_name"),
        Employee.name.label("employee_name")
    ).join(Supplier, Purchase.supplier_id == Supplier.id)\
     .join(Employee, Purchase.employee_id == Employee.id).all()

    purchase_list = []
    for p, s_name, e_name in results:
        data = p.to_dict()
        data["supplier_name"] = s_name
        data["employee_name"] = e_name
        
        # Add summary counts
        details = PurchaseDetail.query.filter_by(purchase_id=p.id).all()
        data["total_items"] = sum(d.quantity for d in details)
        data["total_amount"] = sum(float(d.price) * d.quantity for d in details)
        
        purchase_list.append(data)

    return jsonify(purchase_list), 200

@purchase_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_purchase_details(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({"error": "Purchase not found"}), 404

    details = db.session.query(
        PurchaseDetail,
        Product.name.label("product_name")
    ).join(Product, PurchaseDetail.product_id == Product.id)\
     .filter(PurchaseDetail.purchase_id == id).all()

    items = []
    for d, p_name in details:
        item_data = d.to_dict()
        item_data["product_name"] = p_name
        items.append(item_data)

    result = purchase.to_dict()
    result["supplier_name"] = purchase.supplier.name
    result["employee_name"] = purchase.employee.name
    result["items"] = items

    return jsonify(result), 200

@purchase_bp.route("", methods=["POST"])
@jwt_required()
def create_purchase():
    data = request.get_json(silent=True) or {}
    supplier_id = data.get("supplier_id")
    items = data.get("items", []) # List of {product_id, quantity, price}

    if not supplier_id or not items:
        return jsonify({"error": "Supplier and items are required."}), 400

    employee_id = get_jwt_identity()

    try:
        new_purchase = Purchase(
            supplier_id=int(supplier_id),
            employee_id=int(employee_id),
            note=data.get("note", ""),
            status="pending"
        )
        db.session.add(new_purchase)
        db.session.flush() # Get purchase.id

        for item in items:
            detail = PurchaseDetail(
                purchase_id=new_purchase.id,
                product_id=int(item["product_id"]),
                quantity=int(item["quantity"]),
                price=float(item["price"])
            )
            db.session.add(detail)

        db.session.commit()
        return jsonify({"message": "Purchase order created.", "id": new_purchase.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@purchase_bp.route("/<int:id>/status", methods=["PUT"])
@jwt_required()
def update_purchase_status(id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    warehouse_id = data.get("warehouse_id") # Required for 'received'

    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({"error": "Purchase not found"}), 404

    if purchase.status != "pending":
        return jsonify({"error": f"Cannot update status from {purchase.status}"}), 400

    if new_status not in ["received", "cancelled"]:
        return jsonify({"error": "Invalid status choice."}), 400

    try:
        if new_status == "received":
            if not warehouse_id:
                return jsonify({"error": "Warehouse ID is required to mark as received."}), 400

            # 1. Update stock levels for each item in the purchase
            details = PurchaseDetail.query.filter_by(purchase_id=id).all()
            for item in details:
                inv_record = Inventory.query.filter_by(
                    product_id=item.product_id, 
                    warehouse_id=warehouse_id
                ).first()

                if inv_record:
                    inv_record.inventory_quantity += item.quantity
                else:
                    new_inv = Inventory(
                        product_id=item.product_id,
                        warehouse_id=warehouse_id,
                        inventory_quantity=item.quantity
                    )
                    db.session.add(new_inv)

        purchase.status = new_status
        db.session.commit()
        return jsonify({"message": f"Purchase order {new_status}."}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@purchase_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_purchase(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({"error": "Purchase not found"}), 404

    if purchase.status == "received":
        return jsonify({"error": "Cannot delete a received purchase. Cancel it first (if logic allowed) or archive."}), 400

    try:
        PurchaseDetail.query.filter_by(purchase_id=id).delete()
        db.session.delete(purchase)
        db.session.commit()
        return jsonify({"message": "Purchase removed."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
