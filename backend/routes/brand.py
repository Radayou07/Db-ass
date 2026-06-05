from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy.exc import IntegrityError
from extensions import db
from models import Brand, Product


brand_bp = Blueprint("brand", __name__)


def require_staff():
    claims = get_jwt()
    if claims.get("role") not in ("admin", "staff"):
        return jsonify({"error": "Admin or staff access required."}), 403
    return None


@brand_bp.route("", methods=["GET"])
@jwt_required()
def get_brands():
    denied = require_staff()
    if denied:
        return denied

    brands = Brand.query.order_by(Brand.name.asc()).all()
    return jsonify([brand.to_dict() for brand in brands]), 200


@brand_bp.route("", methods=["POST"])
@jwt_required()
def create_brand():
    denied = require_staff()
    if denied:
        return denied

    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    country = data.get("country")
    country = country.strip() if isinstance(country, str) and country.strip() else None

    if not name:
        return jsonify({"error": "Brand name is required."}), 400

    brand = Brand(name=name, country=country)
    try:
        db.session.add(brand)
        db.session.commit()
        return jsonify(brand.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Brand already exists."}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@brand_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_brand(id):
    denied = require_staff()
    if denied:
        return denied

    brand = Brand.query.get(id)
    if not brand:
        return jsonify({"error": "Brand not found."}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data:
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "Brand name is required."}), 400
        brand.name = name
    if "country" in data:
        country = data.get("country")
        brand.country = country.strip() if isinstance(country, str) and country.strip() else None

    try:
        db.session.commit()
        return jsonify(brand.to_dict()), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Brand already exists."}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@brand_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_brand(id):
    denied = require_staff()
    if denied:
        return denied

    brand = Brand.query.get(id)
    if not brand:
        return jsonify({"error": "Brand not found."}), 404

    if Product.query.filter_by(brand_id=id).first():
        return jsonify({"error": "Cannot delete brand while products use it."}), 400

    try:
        db.session.delete(brand)
        db.session.commit()
        return jsonify({"message": "Brand deleted."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
