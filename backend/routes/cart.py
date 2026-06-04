from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import Cart, Product
from extensions import db

cart_bp = Blueprint("cart", __name__)

def get_customer_id():
    claims = get_jwt()
    if claims.get("role") != "customer":
        return None
    return int(get_jwt_identity())

@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart():
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers have carts"}), 403
        
    items = Cart.query.filter_by(customer_id=customer_id).all()
    return jsonify([item.to_dict() for item in items]), 200

@cart_bp.route("/<int:product_id>", methods=["POST"])
@jwt_required()
def add_to_cart(product_id):
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers can use the cart"}), 403
        
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
        
    data = request.get_json(silent=True) or {}
    quantity = int(data.get("quantity", 1))
    
    if quantity <= 0:
        return jsonify({"error": "Quantity must be greater than zero"}), 400
        
    existing = Cart.query.filter_by(customer_id=customer_id, product_id=product_id).first()
    
    try:
        if existing:
            existing.quantity += quantity
        else:
            new_item = Cart(customer_id=customer_id, product_id=product_id, quantity=quantity)
            db.session.add(new_item)
        db.session.commit()
        return jsonify({"message": "Added to cart"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@cart_bp.route("/<int:product_id>", methods=["PATCH"])
@jwt_required()
def update_cart_item(product_id):
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers can use the cart"}), 403
        
    data = request.get_json(silent=True) or {}
    if "quantity" not in data:
        return jsonify({"error": "Quantity is required"}), 400
        
    quantity = int(data["quantity"])
    item = Cart.query.filter_by(customer_id=customer_id, product_id=product_id).first()
    
    if not item:
        return jsonify({"error": "Item not in cart"}), 404
        
    try:
        if quantity <= 0:
            db.session.delete(item)
            msg = "Removed from cart"
        else:
            item.quantity = quantity
            msg = "Quantity updated"
        db.session.commit()
        return jsonify({"message": msg}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@cart_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_cart(product_id):
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers can use the cart"}), 403
        
    item = Cart.query.filter_by(customer_id=customer_id, product_id=product_id).first()
    if not item:
        return jsonify({"error": "Item not in cart"}), 404
        
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Removed from cart"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@cart_bp.route("", methods=["DELETE"])
@jwt_required()
def clear_cart():
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers can use the cart"}), 403
        
    try:
        Cart.query.filter_by(customer_id=customer_id).delete()
        db.session.commit()
        return jsonify({"message": "Cart cleared"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
