from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Customer, Orders, OrderDetail

customer_bp = Blueprint("customer", __name__)

@customer_bp.route("", methods=["GET"])
@jwt_required()
def get_customers():
    customers = Customer.query.all()
    return jsonify([c.to_dict() for c in customers]), 200

@customer_bp.route("", methods=["POST"])
@jwt_required()
def create_customer():
    data = request.get_json(silent=True) or {}
    try:
        new_customer = Customer(
            name=data.get("name"),
            number=data.get("number"),
            email=data.get("email"),
            address=data.get("address", "N/A")
        )
        if data.get("password"):
            new_customer.set_password(data["password"])
            
        db.session.add(new_customer)
        db.session.commit()
        return jsonify(new_customer.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

@customer_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_customer(id):
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
        
    data = request.get_json(silent=True) or {}
    if "name" in data: customer.name = data["name"]
    if "number" in data: customer.number = data["number"]
    if "email" in data: customer.email = data["email"]
    if "address" in data: customer.address = data["address"]
    
    db.session.commit()
    return jsonify(customer.to_dict()), 200

@customer_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_customer(id):
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    
    # Check for transaction history
    if Orders.query.filter_by(customer_id=id).first():
        return jsonify({"error": "Cannot delete customer with active order history. Archive them instead."}), 400

    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer removed successfully."}), 200

@customer_bp.route("/<int:id>/orders", methods=["GET"])
@jwt_required()
def get_customer_orders(id):
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    
    orders = Orders.query.filter_by(customer_id=id).all()
    results = []
    for order in orders:
        order_data = order.to_dict()
        # Add summary info
        details = OrderDetail.query.filter_by(order_id=order.id).all()
        order_data["total_items"] = sum(d.quantity for d in details)
        order_data["total_amount"] = sum(float(d.price) * d.quantity for d in details)
        results.append(order_data)
        
    return jsonify(results), 200
