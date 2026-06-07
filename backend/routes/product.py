from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Product, Category, Inventory, ProductImage, UnitOfMeasure, Brand, Warehouse, SupplierProduct, Purchase, PurchaseDetail
from datetime import datetime

product_bp = Blueprint("product", __name__)
category_bp = Blueprint("category", __name__)
unit_bp = Blueprint("unit", __name__)

def product_response(product, total_stock=0, category_name=None, uom_name=None, uom_abbreviation=None, warehouse_id=None):
    # Strictly pull cost from 'received' purchase history only
    last_purchase = PurchaseDetail.query.filter_by(product_id=product.id)\
        .join(Purchase)\
        .filter(Purchase.status == 'received')\
        .order_by(Purchase.id.desc())\
        .first()
    
    last_cost = 0
    if last_purchase:
        last_cost = float(last_purchase.price)
    elif product.supplier_links:
        # Initial fallback for brand new products only
        last_cost = float(product.supplier_links[0].unit_price)

    images = [img.to_dict() for img in product.images]
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "last_cost": last_cost,
        "stock": int(total_stock),
        "brand_id": product.brand_id,
        "brand_name": product.brand.name if product.brand else None,
        "company": product.brand.name if product.brand else None,
        "expire": product.expire.isoformat() if product.expire else None,
        "category_id": product.category_id,
        "category_name": category_name or (product.category.name if product.category else None),
        "uom_id": product.uom_id,
        "uom_name": uom_name or (product.uom.name if product.uom else None),
        "uom_abbreviation": uom_abbreviation or (product.uom.abbreviation if product.uom else None),
        "warehouse_id": warehouse_id,
        "discount_percent": float(product.discount_percent) if product.discount_percent else 0,
        "discount_expires_at": product.discount_expires_at.isoformat() if product.discount_expires_at else None,
        "images": images
    }

@product_bp.route("", methods=["GET"])
@jwt_required()
def get_products():
    # 1. Join to get individual warehouse entries
    query = db.session.query(
        Product, 
        Category.name.label("category_name"),
        Inventory.inventory_quantity.label("stock"),
        UnitOfMeasure.name.label("uom_name"),
        UnitOfMeasure.abbreviation.label("uom_abbr"),
        Warehouse.name.label("warehouse_name"),
        Warehouse.id.label("warehouse_id")
    ).join(Category, Product.category_id == Category.id)\
     .outerjoin(UnitOfMeasure, Product.uom_id == UnitOfMeasure.id)\
     .outerjoin(Inventory, Product.id == Inventory.product_id)\
     .outerjoin(Warehouse, Inventory.warehouse_id == Warehouse.id)

    results = query.order_by(Product.id.desc()).all() # Newest Products First
    
    product_list = []
    seen_product_ids = set()

    for p, c_name, stock, u_name, u_abbr, w_name, w_id in results:
        if w_id:
            seen_product_ids.add(p.id)
            resp = product_response(p, stock, c_name, u_name, u_abbr, w_id)
            resp["warehouse_name"] = w_name
            product_list.append(resp)
        
    # 2. Add products with 0 stock
    all_prods = Product.query.all()
    for p in all_prods:
        if p.id not in seen_product_ids:
            product_list.append(product_response(p, 0))

    # 3. Final Re-sort to ensure newest ID is absolute top
    product_list.sort(key=lambda x: x["id"], reverse=True)
    return jsonify(product_list), 200

@product_bp.route("/<int:id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def handle_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    if request.method == "GET":
        # Calculate total stock across all warehouses
        total_stock = db.session.query(func.sum(Inventory.inventory_quantity))\
            .filter(Inventory.product_id == id).scalar() or 0
        return jsonify(product_response(product, total_stock)), 200

    if request.method == "PUT":
        data = request.get_json(silent=True) or {}
        product.name = data.get("name", product.name)
        product.description = data.get("description", product.description)
        product.price = float(data.get("price", product.price))
        product.brand_id = data.get("brand_id", product.brand_id)
        product.category_id = data.get("category_id", product.category_id)
        product.uom_id = data.get("uom_id", product.uom_id)

        if "images" in data:
            ProductImage.query.filter_by(product_id=id).delete()
            for url in data["images"]:
                db.session.add(ProductImage(product_id=id, url=url))

        db.session.commit()
        return jsonify({"message": "Updated"}), 200

    if request.method == "DELETE":
        Inventory.query.filter_by(product_id=id).delete()
        ProductImage.query.filter_by(product_id=id).delete()
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Removed"}), 200

@product_bp.route("", methods=["POST"])

# ─────────────────────────────────────────
# CATEGORY ENDPOINTS
# ─────────────────────────────────────────

@category_bp.route("", methods=["GET"])
@jwt_required()
def get_categories():
    categories = Category.query.all()
    return jsonify([cat.to_dict() for cat in categories]), 200

@category_bp.route("", methods=["POST"])
@jwt_required()
def create_category():
    data = request.get_json(silent=True) or {}
    new_cat = Category(name=data.get("name"))
    db.session.add(new_cat)
    db.session.commit()
    return jsonify(new_cat.to_dict()), 201

@category_bp.route("/<id>", methods=["DELETE", "OPTIONS"])
@jwt_required()
def delete_category(id):
    if request.method == "OPTIONS": return jsonify({"status": "ok"}), 200
    cat = Category.query.get(int(id))
    if not cat: return jsonify({"error": "Not found"}), 404
    db.session.delete(cat)
    db.session.commit()
    return jsonify({"message": "Removed"}), 200

# ─────────────────────────────────────────
# UNIT ENDPOINTS
# ─────────────────────────────────────────

@unit_bp.route("", methods=["GET"])
@jwt_required()
def get_units():
    units = UnitOfMeasure.query.all()
    return jsonify([u.to_dict() for u in units]), 200
