from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Inventory, Warehouse, Product, UnitOfMeasure
from sqlalchemy import func

inventory_bp = Blueprint("inventory", __name__)

# ─────────────────────────────────────────
# WAREHOUSE ENDPOINTS
# ─────────────────────────────────────────

@inventory_bp.route("/warehouses", methods=["GET"])
@jwt_required()
def get_warehouses():
    warehouses = Warehouse.query.all()
    return jsonify([w.to_dict() for w in warehouses]), 200

@inventory_bp.route("/warehouses", methods=["POST"])
@jwt_required()
def create_warehouse():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    location = data.get("location", "").strip()
    capacity = data.get("capacity")

    if not name or not location or capacity is None:
        return jsonify({"error": "Name, location, and capacity are required."}), 400

    new_warehouse = Warehouse(name=name, location=location, capacity=int(capacity))
    db.session.add(new_warehouse)
    db.session.commit()
    return jsonify(new_warehouse.to_dict()), 201

@inventory_bp.route("/warehouses/<int:id>", methods=["PUT"])
@jwt_required()
def update_warehouse(id):
    warehouse = Warehouse.query.get(id)
    if not warehouse:
        return jsonify({"error": "Warehouse not found"}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data: warehouse.name = data["name"].strip()
    if "location" in data: warehouse.location = data["location"].strip()
    if "capacity" in data: warehouse.capacity = int(data["capacity"])

    db.session.commit()
    return jsonify(warehouse.to_dict()), 200

@inventory_bp.route("/warehouses/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_warehouse(id):
    warehouse = Warehouse.query.get(id)
    if not warehouse:
        return jsonify({"error": "Warehouse not found"}), 404

    # Safe check: Are there inventory records tied to this warehouse?
    if Inventory.query.filter_by(warehouse_id=id).first():
        return jsonify({"error": "Cannot delete warehouse containing stock. Relocate items first."}), 400

    db.session.delete(warehouse)
    db.session.commit()
    return jsonify({"message": "Warehouse removed successfully."}), 200

# ─────────────────────────────────────────
# INVENTORY ENDPOINTS
# ─────────────────────────────────────────

@inventory_bp.route("", methods=["GET"])
@jwt_required()
def get_inventory():
    # Fetch all records with product and warehouse names
    results = db.session.query(
        Inventory,
        Product.name.label("product_name"),
        Warehouse.name.label("warehouse_name"),
        UnitOfMeasure.abbreviation.label("uom_abbreviation")
    ).join(Product, Inventory.product_id == Product.id)\
     .join(Warehouse, Inventory.warehouse_id == Warehouse.id)\
     .outerjoin(UnitOfMeasure, Product.uom_id == UnitOfMeasure.id).all()

    inv_list = []
    for inv, p_name, w_name, uom_abbr in results:
        inv_data = {
            "id": inv.id,
            "product_id": inv.product_id,
            "product_name": p_name,
            "warehouse_id": inv.warehouse_id,
            "warehouse_name": w_name,
            "quantity": inv.inventory_quantity,
            "uom_abbreviation": uom_abbr or "",
            "last_update": inv.last_update.isoformat()
        }
        inv_list.append(inv_data)

    return jsonify(inv_list), 200

@inventory_bp.route("", methods=["POST"])
@jwt_required()
def update_stock_level():
    """Create or update a specific stock record"""
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    warehouse_id = data.get("warehouse_id")
    quantity = data.get("quantity")

    if not product_id or not warehouse_id or quantity is None:
        return jsonify({"error": "Product ID, Warehouse ID, and quantity are required."}), 400

    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse:
        return jsonify({"error": "Warehouse not found"}), 404

    # Calculate capacity usage
    current_usage = db.session.query(func.sum(Inventory.inventory_quantity)).filter_by(warehouse_id=warehouse_id).scalar() or 0
    inv_record = Inventory.query.filter_by(product_id=product_id, warehouse_id=warehouse_id).first()
    
    old_qty = inv_record.inventory_quantity if inv_record else 0
    new_usage = current_usage - old_qty + int(quantity)

    if new_usage > warehouse.capacity:
        return jsonify({
            "error": f"Warehouse capacity exceeded. (Requested total: {new_usage}, Max: {warehouse.capacity})"
        }), 400

    if inv_record:
        inv_record.inventory_quantity = int(quantity)
    else:
        inv_record = Inventory(
            product_id=int(product_id),
            warehouse_id=int(warehouse_id),
            inventory_quantity=int(quantity)
        )
        db.session.add(inv_record)

    db.session.commit()
    return jsonify({"message": "Stock level updated."}), 200
