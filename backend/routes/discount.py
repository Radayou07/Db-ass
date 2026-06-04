from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import Discount, Cart, Product
from extensions import db
from datetime import datetime

discount_bp = Blueprint("discount", __name__)

def verify_admin_privileges():
    claims = get_jwt()
    if claims.get("role") not in ["admin", "staff"]:
        return False
    return True

@discount_bp.route("", methods=["GET"])
@jwt_required()
def get_discounts():
    if not verify_admin_privileges():
        return jsonify({"error": "Unauthorized"}), 403
    discounts = Discount.query.all()
    return jsonify([d.to_dict() for d in discounts]), 200

@discount_bp.route("", methods=["POST"])
@jwt_required()
def create_discount():
    if not verify_admin_privileges():
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json(silent=True) or {}
    code = data.get("code", "").strip()
    type = data.get("type")
    value = data.get("value")
    
    if not code or not type or value is None:
        return jsonify({"error": "Missing required fields"}), 400
        
    expires_at = None
    if data.get("expires_at"):
        try:
            expires_at = datetime.strptime(data["expires_at"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid expires_at format. Use YYYY-MM-DD."}), 400

    new_discount = Discount(
        code=code,
        type=type,
        value=float(value),
        min_order=float(data.get("min_order", 0)),
        expires_at=expires_at,
        is_active=data.get("is_active", True)
    )
    
    try:
        db.session.add(new_discount)
        db.session.commit()
        return jsonify(new_discount.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@discount_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def toggle_discount(id):
    if not verify_admin_privileges():
        return jsonify({"error": "Unauthorized"}), 403
        
    discount = Discount.query.get(id)
    if not discount:
        return jsonify({"error": "Discount not found"}), 404
        
    data = request.get_json(silent=True) or {}
    if "is_active" in data:
        discount.is_active = data["is_active"]
        
    try:
        db.session.commit()
        return jsonify(discount.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@discount_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_discount():
    data = request.get_json(silent=True) or {}
    code = data.get("code", "").strip()
    
    claims = get_jwt()
    if claims.get("role") != "customer":
        return jsonify({"error": "Only customers can apply discounts to cart"}), 403
        
    customer_id = int(get_jwt_identity())
    
    if not code:
        return jsonify({"error": "Code is required"}), 400
        
    cart_items = Cart.query.filter_by(customer_id=customer_id).all()
    if not cart_items:
        return jsonify({"valid": False, "message": "Cart is empty"}), 200
        
    original_subtotal = 0
    subtotal = 0
    
    for item in cart_items:
        product_dict = item.product.to_dict()
        qty = item.quantity
        original_price = float(product_dict["price"])
        sale_price = float(product_dict["sale_price"])
        
        original_subtotal += (original_price * qty)
        subtotal += (sale_price * qty)
        
    product_savings = original_subtotal - subtotal
        
    discount = Discount.query.filter_by(code=code).first()
    
    if not discount:
        return jsonify({"valid": False, "message": "Invalid coupon code"}), 200
        
    if not discount.is_active:
        return jsonify({"valid": False, "message": "Coupon is inactive"}), 200
        
    if discount.expires_at and discount.expires_at < datetime.utcnow().date():
        return jsonify({"valid": False, "message": "Coupon has expired"}), 200
        
    if discount.min_order and subtotal < float(discount.min_order):
        return jsonify({"valid": False, "message": f"Minimum order amount is ${float(discount.min_order)}"}), 200
        
    coupon_savings = 0
    if discount.type == "percent":
        coupon_savings = subtotal * (float(discount.value) / 100)
    else:
        coupon_savings = float(discount.value)
        
    if coupon_savings > subtotal:
        coupon_savings = subtotal
        
    final_total = subtotal - coupon_savings
    
    return jsonify({
        "valid": True,
        "original_subtotal": round(original_subtotal, 2),
        "product_savings": round(product_savings, 2),
        "coupon_savings": round(coupon_savings, 2),
        "final_total": round(final_total, 2),
        "discount_id": discount.id,
        "message": "Coupon applied successfully!"
    }), 200
