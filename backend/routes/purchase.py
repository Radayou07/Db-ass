from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Purchase, PurchaseDetail, Product, Inventory, Employee, Supplier, SupplierProduct, Warehouse
from datetime import datetime

purchase_bp = Blueprint("purchase", __name__)

@purchase_bp.route("", methods=["GET"])
@jwt_required()
def get_purchases():
    results = db.session.query(
        Purchase,
        Supplier.name.label("supplier_name"),
        Employee.name.label("employee_name")
    ).outerjoin(Supplier, Purchase.supplier_id == Supplier.id)\
     .outerjoin(Employee, Purchase.employee_id == Employee.id)\
     .order_by(Purchase.id.desc()).all()

    purchase_list = []
    for p, s_name, e_name in results:
        data = p.to_dict()
        data["supplier_name"] = s_name or "Unknown Supplier"
        data["employee_name"] = e_name or "Unknown Employee"
        
        # Get supplier phone numbers
        supplier = Supplier.query.get(p.supplier_id)
        data["supplier_phones"] = [n.number for n in supplier.numbers] if supplier else []
        
        details = db.session.query(
            PurchaseDetail,
            Product.name.label("product_name")
        ).outerjoin(Product, PurchaseDetail.product_id == Product.id)\
         .filter(PurchaseDetail.purchase_id == p.id).all()
        
        data["product_ids"] = [d.product_id for d, name in details]
        data["product_names"] = [name or f"Product #{d.product_id}" for d, name in details]
        data["total_items"] = sum(d.quantity for d, name in details)
        data["total_amount"] = sum(float(d.price) * d.quantity for d, name in details)
        
        purchase_list.append(data)

    return jsonify(purchase_list), 200

@purchase_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_purchase_details(id):
    purchase_row = db.session.query(
        Purchase,
        Supplier.name.label("supplier_name"),
        Employee.name.label("employee_name")
    ).outerjoin(Supplier, Purchase.supplier_id == Supplier.id)\
     .outerjoin(Employee, Purchase.employee_id == Employee.id)\
     .filter(Purchase.id == id).first()

    if not purchase_row:
        return jsonify({"error": "Purchase not found"}), 404

    purchase, supplier_name, employee_name = purchase_row

    details = db.session.query(
        PurchaseDetail,
        Product.name.label("product_name")
    ).outerjoin(Product, PurchaseDetail.product_id == Product.id)\
     .filter(PurchaseDetail.purchase_id == id).all()

    items = []
    for d, p_name in details:
        item_data = d.to_dict()
        item_data["product_name"] = p_name or f"Product #{d.product_id}"
        item_data["line_total"] = float(d.price) * d.quantity
        
        # Get product image
        product = Product.query.get(d.product_id)
        image = next((img.url for img in product.images if img.is_primary), None)
        if not image and product.images:
            image = product.images[0].url
        item_data["image_url"] = image
        
        items.append(item_data)

    result = purchase.to_dict()
    result["supplier_name"] = supplier_name or "Unknown Supplier"
    result["employee_name"] = employee_name or "Unknown Employee"
    result["items"] = items
    result["total_items"] = sum(item["quantity"] for item in items)
    result["total_amount"] = sum(item["line_total"] for item in items)

    return jsonify(result), 200

@purchase_bp.route("", methods=["POST"])
@jwt_required()
def create_purchase():
    data = request.get_json(silent=True) or {}
    supplier_id = data.get("supplier_id")
    items = data.get("items", []) 

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
        db.session.flush()

        for item in items:
            product_id = int(item["product_id"])
            supplier_product = SupplierProduct.query.filter_by(
                supplier_id=int(supplier_id),
                product_id=product_id,
                is_active=True
            ).first()
            if not supplier_product:
                db.session.rollback()
                return jsonify({"error": f"Supplier does not sell product #{product_id}"}), 400

            detail = PurchaseDetail(
                purchase_id=new_purchase.id,
                product_id=product_id,
                quantity=int(item["quantity"]),
                price=float(item.get("price", supplier_product.unit_price))
            )
            db.session.add(detail)

        db.session.commit()
        return jsonify({"message": "Purchase order created.", "id": new_purchase.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@purchase_bp.route("/<int:id>/status", methods=["PUT", "OPTIONS"])
def update_purchase_status(id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    
    return update_purchase_status_authenticated(id)

@jwt_required()
def update_purchase_status_authenticated(id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    warehouse_id = data.get("warehouse_id")

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

            warehouse = Warehouse.query.get(warehouse_id)
            if not warehouse:
                return jsonify({"error": "Target warehouse not found."}), 404

            details = PurchaseDetail.query.filter_by(purchase_id=id).all()
            incoming_qty = sum(item.quantity for item in details)

            current_usage = db.session.query(func.sum(Inventory.inventory_quantity)).filter_by(warehouse_id=warehouse_id).scalar() or 0
            
            if current_usage + incoming_qty > warehouse.capacity:
                return jsonify({"error": f"Warehouse full. Needs {incoming_qty} units space."}), 400

            for item in details:
                inv_record = Inventory.query.filter_by(product_id=item.product_id, warehouse_id=warehouse_id).first()
                if inv_record:
                    inv_record.inventory_quantity += item.quantity
                else:
                    db.session.add(Inventory(product_id=item.product_id, warehouse_id=warehouse_id, inventory_quantity=item.quantity))
                
                # Update Supplier price link ONLY on receipt
                link = SupplierProduct.query.filter_by(supplier_id=purchase.supplier_id, product_id=item.product_id).first()
                if link:
                    link.unit_price = item.price

            purchase.employee_id = int(get_jwt_identity())

        purchase.status = new_status
        db.session.commit()
        return jsonify({"message": f"Order {new_status}."}), 200

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
        return jsonify({"error": "Cannot delete a received purchase."}), 400

    try:
        PurchaseDetail.query.filter_by(purchase_id=id).delete()
        db.session.delete(purchase)
        db.session.commit()
        return jsonify({"message": "Purchase removed."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
