from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import Wishlist, Product, Customer
from extensions import db

wishlist_bp = Blueprint("wishlist", __name__)

def get_customer_id():
    claims = get_jwt()
    if claims.get("role") != "customer":
        return None
    return get_jwt_identity()

@wishlist_bp.route("", methods=["GET"])
@jwt_required()
def get_wishlist():
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers have wishlists"}), 403
        
    items = Wishlist.query.filter_by(customer_id=customer_id).all()
    return jsonify([item.to_dict() for item in items]), 200

@wishlist_bp.route("/<int:product_id>", methods=["POST"])
@jwt_required()
def add_to_wishlist(product_id):
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers can add to wishlists"}), 403
        
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
        
    existing = Wishlist.query.filter_by(customer_id=customer_id, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Already in wishlist"}), 200
        
    new_item = Wishlist(customer_id=customer_id, product_id=product_id)
    
    try:
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@wishlist_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(product_id):
    customer_id = get_customer_id()
    if not customer_id:
        return jsonify({"error": "Only customers can remove from wishlists"}), 403
        
    item = Wishlist.query.filter_by(customer_id=customer_id, product_id=product_id).first()
    if not item:
        return jsonify({"error": "Not in wishlist"}), 404
        
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Removed from wishlist"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
