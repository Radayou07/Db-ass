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
    last_purchase_row = db.session.query(PurchaseDetail, Purchase.supplier_id)\
        .join(Purchase, PurchaseDetail.purchase_id == Purchase.id)\
        .filter(PurchaseDetail.product_id == product.id)\
        .filter(Purchase.status == 'received')\
        .order_by(Purchase.id.desc())\
        .first()
    
    last_cost = 0
    source_supplier_id = None
    
    if last_purchase_row:
        detail, s_id = last_purchase_row
        last_cost = float(detail.price)
        source_supplier_id = s_id
    elif product.supplier_links:
        # Initial fallback for brand new products only
        last_cost = float(product.supplier_links[0].unit_price)
        source_supplier_id = product.supplier_links[0].supplier_id

    images = [img.to_dict() for img in product.images]
    
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "last_cost": last_cost,
        "source_supplier_id": source_supplier_id,
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
    # Use a grouped query to get unique products with their total aggregated stock
    query = db.session.query(
        Product, 
        Category.name.label("category_name"),
        func.sum(Inventory.inventory_quantity).label("total_stock"),
        UnitOfMeasure.name.label("uom_name"),
        UnitOfMeasure.abbreviation.label("uom_abbr")
    ).outerjoin(Category, Product.category_id == Category.id)\
     .outerjoin(UnitOfMeasure, Product.uom_id == UnitOfMeasure.id)\
     .outerjoin(Inventory, Product.id == Inventory.product_id)\
     .group_by(Product.id, Category.id, Category.name, UnitOfMeasure.id, UnitOfMeasure.name, UnitOfMeasure.abbreviation)\
     .order_by(Product.id.desc())

    results = query.all()
    
    product_list = []
    for p, c_name, stock, u_name, u_abbr in results:
        # Pass aggregated stock to product_response
        resp = product_response(p, stock or 0, c_name, u_name, u_abbr)
        product_list.append(resp)

    return jsonify(product_list), 200

@product_bp.route("/<int:id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def handle_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    def clean_id(val):
        if val == "" or val is None: return None
        try: return int(val)
        except: return None
            
    def clean_float(val, default):
        if val == "" or val is None: return float(default)
        try: return float(val)
        except: return float(default)

    if request.method == "GET":
        # Calculate total stock across all warehouses
        total_stock = db.session.query(func.sum(Inventory.inventory_quantity))\
            .filter(Inventory.product_id == id).scalar() or 0
        return jsonify(product_response(product, total_stock)), 200

    if request.method == "PUT":
        data = request.get_json(silent=True) or {}
        product.name = data.get("name", product.name)
        product.description = data.get("description", product.description)
        product.price = clean_float(data.get("price"), product.price)
        
        if "brand_id" in data:    product.brand_id = clean_id(data.get("brand_id"))
        if "category_id" in data: product.category_id = clean_id(data.get("category_id"))
        if "uom_id" in data:      product.uom_id = clean_id(data.get("uom_id"))
        
        if data.get("expire"):
            try:
                product.expire = datetime.strptime(data.get("expire"), "%Y-%m-%d").date()
            except:
                pass

        if "images" in data:
            ProductImage.query.filter_by(product_id=id).delete()
            for i, url in enumerate(data["images"]):
                if url:
                    db.session.add(ProductImage(product_id=id, url=url, is_primary=(i == 0)))

        # Handle supplier price link update if provided
        supplier_id = clean_id(data.get("source_supplier_id"))
        # Support both 'source_unit_price' (Suppliers page) and 'buy_cost' (Products page)
        unit_price = data.get("source_unit_price") or data.get("buy_cost")
        
        if supplier_id and unit_price is not None:
            link = SupplierProduct.query.filter_by(supplier_id=supplier_id, product_id=id).first()
            if link:
                link.unit_price = clean_float(unit_price, link.unit_price)

        db.session.commit()
        return jsonify({"message": "Updated"}), 200

    if request.method == "DELETE":
        Inventory.query.filter_by(product_id=id).delete()
        ProductImage.query.filter_by(product_id=id).delete()
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Removed"}), 200

@product_bp.route("", methods=["POST"])
@jwt_required()
def create_product():
    data = request.get_json(silent=True) or {}
    
    def clean_id(val):
        if val == "" or val is None: return None
        try: return int(val)
        except: return None

    try:
        # 1. Create Product
        new_product = Product(
            name=data.get("name"),
            description=data.get("description"),
            price=float(data.get("price", 0) or 0),
            brand_id=clean_id(data.get("brand_id")),
            category_id=clean_id(data.get("category_id")),
            uom_id=clean_id(data.get("uom_id")),
            expire=datetime.strptime(data.get("expire"), "%Y-%m-%d").date() if data.get("expire") else None
        )
        
        if not new_product.category_id:
            return jsonify({"error": "Category is required"}), 400

        db.session.add(new_product)
        db.session.flush() # Get product ID

        # 2. Add Images
        images = data.get("images", [])
        if isinstance(images, list):
            for i, url in enumerate(images):
                if url:
                    db.session.add(ProductImage(
                        product_id=new_product.id,
                        url=url,
                        is_primary=(i == 0)
                    ))

        # 3. Handle Supplier Link
        supplier_id = clean_id(data.get("source_supplier_id"))
        # Support both 'source_unit_price' (Suppliers page) and 'buy_cost' (Products page)
        unit_price = float(data.get("source_unit_price") or data.get("buy_cost") or 0)
        if supplier_id:
            db.session.add(SupplierProduct(
                supplier_id=supplier_id,
                product_id=new_product.id,
                unit_price=unit_price,
                is_active=True
            ))

        # 4. Handle Initial Stock
        initial_qty = int(data.get("initial_quantity", 0) or 0)
        warehouse_id = clean_id(data.get("warehouse_id"))
        if initial_qty > 0 and warehouse_id:
            # Check capacity
            warehouse = Warehouse.query.get(warehouse_id)
            if not warehouse:
                 return jsonify({"error": "Warehouse not found"}), 404
            
            current_usage = db.session.query(func.sum(Inventory.inventory_quantity)).filter_by(warehouse_id=warehouse_id).scalar() or 0
            if current_usage + initial_qty > warehouse.capacity:
                return jsonify({"error": f"Warehouse full. Capacity: {warehouse.capacity}, Usage: {current_usage}, Requested: {initial_qty}"}), 400

            db.session.add(Inventory(
                product_id=new_product.id,
                warehouse_id=warehouse_id,
                inventory_quantity=initial_qty
            ))

            # 5. Create Purchase History (for last_cost tracking)
            employee_id = get_jwt_identity()
            new_purchase = Purchase(
                date=datetime.utcnow().date(),
                note="Initial stock on product creation",
                status="received",
                supplier_id=supplier_id,
                employee_id=int(employee_id)
            )
            db.session.add(new_purchase)
            db.session.flush()

            db.session.add(PurchaseDetail(
                purchase_id=new_purchase.id,
                product_id=new_product.id,
                quantity=initial_qty,
                price=unit_price
            ))

        db.session.commit()
        return jsonify(product_response(new_product, initial_qty)), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
