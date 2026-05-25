from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Supplier, Purchase, PurchaseDetail

supplier_bp = Blueprint("supplier", __name__)

@supplier_bp.route("", methods=["GET"])
@jwt_required()
def get_suppliers():
    suppliers = Supplier.query.all()
    return jsonify([s.to_dict() for s in suppliers]), 200

@supplier_bp.route("", methods=["POST"])
@jwt_required()
def create_supplier():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    number = data.get("number", "").strip()
    email = data.get("email", "").strip()
    address = data.get("address", "").strip()

    if not name or not number or not email or not address:
        return jsonify({"error": "Name, number, email, and address are required."}), 400

    new_supplier = Supplier(name=name, number=number, email=email, address=address)
    db.session.add(new_supplier)
    db.session.commit()
    return jsonify(new_supplier.to_dict()), 201

@supplier_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data: supplier.name = data["name"].strip()
    if "number" in data: supplier.number = data["number"].strip()
    if "email" in data: supplier.email = data["email"].strip()
    if "address" in data: supplier.address = data["address"].strip()

    db.session.commit()
    return jsonify(supplier.to_dict()), 200

@supplier_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    db.session.delete(supplier)
    db.session.commit()
    return jsonify({"message": "Supplier removed successfully."}), 200

@supplier_bp.route("/<int:id>/purchases", methods=["GET"])
@jwt_required()
def get_supplier_purchases(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404
    
    purchases = Purchase.query.filter_by(supplier_id=id).all()
    results = []
    for purchase in purchases:
        purchase_data = purchase.to_dict()
        # Add summary info
        details = PurchaseDetail.query.filter_by(purchase_id=purchase.id).all()
        purchase_data["total_items"] = sum(d.quantity for d in details)
        purchase_data["total_amount"] = sum(float(d.price) * d.quantity for d in details)
        results.append(purchase_data)
        
    return jsonify(results), 200
