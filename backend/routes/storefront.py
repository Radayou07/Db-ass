from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import StorefrontBanner, StorefrontConfig, Employee

storefront_bp = Blueprint("storefront", __name__)

@storefront_bp.route("/config", methods=["GET"])
def get_config():
    config = StorefrontConfig.query.get(1)
    if not config:
        return jsonify({
            "side_promo_title": "Huge Sale", 
            "side_promo_subtitle": "70% OFF", 
            "side_promo_link": "/customer/products",
            "side_promo_image_url": None
        }), 200
    return jsonify(config.to_dict()), 200

@storefront_bp.route("/config", methods=["PUT"])
@jwt_required()
def update_config():
    config = StorefrontConfig.query.get(1)
    if not config:
        config = StorefrontConfig(id=1)
        db.session.add(config)
    
    data = request.get_json(silent=True) or {}
    try:
        if "side_promo_title" in data: config.side_promo_title = data["side_promo_title"]
        if "side_promo_subtitle" in data: config.side_promo_subtitle = data["side_promo_subtitle"]
        if "side_promo_link" in data: config.side_promo_link = data["side_promo_link"]
        if "side_promo_image_url" in data: config.side_promo_image_url = data["side_promo_image_url"]
        
        db.session.commit()
        return jsonify(config.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@storefront_bp.route("/banners", methods=["GET"])
def get_banners():
    banners = StorefrontBanner.query.filter_by(is_active=True).order_by(StorefrontBanner.display_order.asc(), StorefrontBanner.id.desc()).all()
    return jsonify([b.to_dict() for b in banners]), 200

@storefront_bp.route("/banners/all", methods=["GET"])
@jwt_required()
def get_all_banners():
    banners = StorefrontBanner.query.order_by(StorefrontBanner.display_order.asc(), StorefrontBanner.id.desc()).all()
    return jsonify([b.to_dict() for b in banners]), 200

@storefront_bp.route("/banners", methods=["POST"])
@jwt_required()
def create_banner():
    data = request.get_json(silent=True) or {}
    image_url = data.get("image_url")
    if not image_url:
        return jsonify({"error": "Image URL is required"}), 400
    
    try:
        new_banner = StorefrontBanner(
            image_url=image_url,
            title_text=data.get("title_text"),
            subtitle_text=data.get("subtitle_text"),
            link_url=data.get("link_url"),
            display_order=data.get("display_order", 0),
            is_active=data.get("is_active", True)
        )
        db.session.add(new_banner)
        db.session.commit()
        return jsonify(new_banner.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@storefront_bp.route("/banners/<int:id>", methods=["PUT"])
@jwt_required()
def update_banner(id):
    banner = StorefrontBanner.query.get(id)
    if not banner:
        return jsonify({"error": "Banner not found"}), 404
    
    data = request.get_json(silent=True) or {}
    try:
        if "image_url" in data: banner.image_url = data["image_url"]
        if "title_text" in data: banner.title_text = data["title_text"]
        if "subtitle_text" in data: banner.subtitle_text = data["subtitle_text"]
        if "link_url" in data: banner.link_url = data["link_url"]
        if "display_order" in data: banner.display_order = data["display_order"]
        if "is_active" in data: banner.is_active = data["is_active"]
        
        db.session.commit()
        return jsonify(banner.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@storefront_bp.route("/banners/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_banner(id):
    banner = StorefrontBanner.query.get(id)
    if not banner:
        return jsonify({"error": "Banner not found"}), 404
    
    try:
        db.session.delete(banner)
        db.session.commit()
        return jsonify({"message": "Banner deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
