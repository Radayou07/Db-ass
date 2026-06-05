from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func
from extensions import db
from models import Product, Category, Inventory, ProductImage, Warehouse, UnitOfMeasure, OrderDetail, Purchase, PurchaseDetail, Supplier, Brand, SupplierProduct
from datetime import datetime

product_bp = Blueprint("product", __name__)
category_bp = Blueprint("category", __name__)
unit_bp = Blueprint("unit", __name__)

# Helper helper macro to gate destructive mutations to Admin accounts
def verify_admin_privileges():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return True # Temporarily allowing for all roles as requested
    return True

def require_staff_privileges():
    claims = get_jwt()
    if claims.get("role") not in ("admin", "staff"):
        return jsonify({"error": "Admin or staff access required."}), 403
    return None

def clean_optional_text(value, default=None):
    if value is None:
        return default
    value = str(value).strip()
    return value or default

def parse_required_int(data, field, label):
    value = data.get(field)
    if value in (None, ""):
        raise ValueError(f"{label} is required.")
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{label} must be a valid number.")

def parse_optional_int(data, field, label):
    value = data.get(field)
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{label} must be a valid number.")

def parse_money(data, field, label, default=None):
    value = data.get(field, default)
    if value in (None, ""):
        if default is None:
            raise ValueError(f"{label} is required.")
        value = default
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{label} must be a valid number.")
    if value < 0:
        raise ValueError(f"{label} cannot be negative.")
    return value

def parse_date(data, field, label):
    value = data.get(field)
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"{label} must use YYYY-MM-DD format.")

def clean_image_urls(images):
    if images in (None, ""):
        return []
    if not isinstance(images, list):
        raise ValueError("Images must be a list of URLs.")
    return [str(url).strip() for url in images if str(url).strip()]

def product_response(product, total_stock=0, category_name=None, uom_name=None, uom_abbreviation=None, warehouse_id=None):
    last_purchase = PurchaseDetail.query.filter_by(product_id=product.id)\
        .join(Purchase)\
        .order_by(Purchase.date.desc(), Purchase.id.desc())\
        .first()
    last_cost = float(last_purchase.price) if last_purchase else 0

    try:
        images = [img.to_dict() for img in product.images]
    except Exception:
        images = []

    brand_name = product.brand.name if product.brand else None
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "last_cost": last_cost,
        "brand_id": product.brand_id,
        "brand_name": brand_name,
        "company": brand_name,
        "expire": product.expire.isoformat() if product.expire else None,
        "category_id": product.category_id,
        "category_name": category_name if category_name is not None else (product.category.name if product.category else None),
        "uom_id": product.uom_id,
        "uom_name": uom_name if uom_name is not None else (product.uom.name if product.uom else None),
        "uom_abbreviation": uom_abbreviation if uom_abbreviation is not None else (product.uom.abbreviation if product.uom else None),
        "stock": int(total_stock) if total_stock is not None else 0,
        "warehouse_id": warehouse_id,
        "discount_percent": float(product.discount_percent) if product.discount_percent else 0,
        "discount_expires_at": product.discount_expires_at.isoformat() if product.discount_expires_at else None,
        "sale_price": product.to_dict()["sale_price"],
        "has_discount": product.to_dict()["has_discount"],
        "images": [{**img, "url": img["url"].replace(":5000/", ":5001/")} for img in images]
    }

def validate_product_payload(data, require_all=True):
    name = clean_optional_text(data.get("name"))
    if require_all and not name:
        raise ValueError("Product name is required.")

    price = parse_money(data, "price", "Price") if require_all or "price" in data else None
    category_id = parse_required_int(data, "category_id", "Category") if require_all or "category_id" in data else None
    uom_id = parse_required_int(data, "uom_id", "Unit of measure") if require_all or "uom_id" in data else None
    brand_id = parse_required_int(data, "brand_id", "Brand") if require_all or "brand_id" in data else None
    warehouse_id = parse_optional_int(data, "warehouse_id", "Warehouse") if require_all or "warehouse_id" in data else None
    initial_quantity = parse_optional_int(data, "initial_quantity", "Initial quantity") if require_all or "initial_quantity" in data else None

    if initial_quantity is not None and initial_quantity < 0:
        raise ValueError("Initial quantity cannot be negative.")
    if initial_quantity is not None and initial_quantity > 0 and warehouse_id is None:
        raise ValueError("Warehouse is required when initial quantity is greater than zero.")

    discount_percent = parse_money(data, "discount_percent", "Discount percent", 0) if require_all or "discount_percent" in data else None
    if discount_percent is not None and discount_percent > 100:
        raise ValueError("Discount percent cannot exceed 100.")

    expire_date = parse_date(data, "expire", "Expiration date") if require_all or "expire" in data else None
    discount_expires_at = parse_date(data, "discount_expires_at", "Discount expiration date") if require_all or "discount_expires_at" in data else None
    images = clean_image_urls(data.get("images", [])) if require_all or "images" in data else None

    if category_id is not None and not Category.query.get(category_id):
        raise LookupError("Category not found.")
    if uom_id is not None and not UnitOfMeasure.query.get(uom_id):
        raise LookupError("Unit of measure not found.")
    if brand_id is not None and not Brand.query.get(brand_id):
        raise LookupError("Brand not found.")

    warehouse = None
    if warehouse_id is not None:
        warehouse = Warehouse.query.get(warehouse_id)
        if not warehouse:
            raise LookupError("Warehouse not found.")

    if initial_quantity is not None and warehouse is not None:
        current_usage = db.session.query(func.sum(Inventory.inventory_quantity)).filter_by(warehouse_id=warehouse_id).scalar() or 0
        if current_usage + initial_quantity > warehouse.capacity:
            raise ValueError(
                f"Warehouse capacity exceeded. Requested total: {current_usage + initial_quantity}, Max: {warehouse.capacity}."
            )

    return {
        "name": name,
        "description": clean_optional_text(data.get("description")),
        "price": price,
        "brand_id": brand_id,
        "expire": expire_date,
        "category_id": category_id,
        "uom_id": uom_id,
        "discount_percent": discount_percent,
        "discount_expires_at": discount_expires_at,
        "initial_quantity": initial_quantity,
        "warehouse_id": warehouse_id,
        "images": images,
    }

@product_bp.route("/warehouses", methods=["GET"])
def get_warehouses():
    warehouses = Warehouse.query.all()
    return jsonify([w.to_dict() for w in warehouses]), 200

# ─────────────────────────────────────────
# PRODUCT ENDPOINTS
# ─────────────────────────────────────────

@product_bp.route("", methods=["GET"])
@jwt_required()
def get_products():
    # 1. Aggregate tracking query grouping stock values by product ID
    stock_sub = db.session.query(
        Inventory.product_id,
        func.sum(Inventory.inventory_quantity).label("total_stock")
    ).group_by(Inventory.product_id).subquery()

    # 2. Main structural join query
    query = db.session.query(
        Product, 
        Category.name.label("category_name"),
        stock_sub.c.total_stock,
        UnitOfMeasure.name.label("uom_name"),
        UnitOfMeasure.abbreviation.label("uom_abbreviation")
    ).join(Category, Product.category_id == Category.id)\
     .outerjoin(Brand, Product.brand_id == Brand.id)\
     .outerjoin(UnitOfMeasure, Product.uom_id == UnitOfMeasure.id)\
     .outerjoin(stock_sub, Product.id == stock_sub.c.product_id)

    results = query.all()
    
    product_list = []
    for product, cat_name, total_stock, uom_name, uom_abbr in results:
        product_list.append(product_response(product, total_stock, cat_name, uom_name, uom_abbr))

    return jsonify(product_list), 200


@product_bp.route("", methods=["POST"])
@jwt_required()
def create_product():
    print("\n--- CREATE PRODUCT REQUEST RECEIVED ---")
    data = request.get_json(silent=True) or {}
    print(f"Input data: {data}")
    
    try:
        product_data = validate_product_payload(data)

        print(
            "Creating product object: "
            f"name={product_data['name']}, "
            f"price={product_data['price']}, "
            f"cat={product_data['category_id']}, "
            f"uom={product_data['uom_id']}"
        )
        new_product = Product(
            name=product_data["name"],
            description=product_data["description"],
            price=product_data["price"],
            brand_id=product_data["brand_id"],
            expire=product_data["expire"],
            category_id=product_data["category_id"],
            uom_id=product_data["uom_id"],
            discount_percent=product_data["discount_percent"],
            discount_expires_at=product_data["discount_expires_at"]
        )

        print("Adding product to session...")
        db.session.add(new_product)
        
        initial_qty = product_data["initial_quantity"]
        warehouse_id = product_data["warehouse_id"]
        if initial_qty is not None and warehouse_id is not None:
            db.session.flush()
            new_inv = Inventory(
                product_id=new_product.id,
                warehouse_id=warehouse_id,
                inventory_quantity=initial_qty
            )
            db.session.add(new_inv)
            print(f"Initial stock added: {initial_qty} units in warehouse {warehouse_id}")
        
        images = product_data["images"]
        if images:
            print(f"Attempting to save {len(images)} images...")
            db.session.flush()
            print(f"Assigned ID: {new_product.id}")
            for i, img_url in enumerate(images):
                new_img = ProductImage(
                    product_id=new_product.id,
                    url=img_url,
                    is_primary=(i == 0)
                )
                db.session.add(new_img)

        print("Finalizing database commit...")
        db.session.commit()
        print("--- PRODUCT LOGGED SUCCESSFULLY ---")
        return jsonify({"message": "Product logged successfully.", "id": new_product.id}), 201

    except LookupError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"CRITICAL PRODUCT CREATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


@product_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_single_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({"error": "Target entity target not found."}), 404

    # Calculate current localized stock configurations
    stock_sum = db.session.query(func.sum(Inventory.inventory_quantity)).filter(Inventory.product_id == id).scalar()

    # Get primary warehouse record if it exists
    primary_inv = Inventory.query.filter_by(product_id=id).first()

    return jsonify(product_response(
        product,
        stock_sum,
        product.category.name if product.category else None,
        product.uom.name if product.uom else None,
        product.uom.abbreviation if product.uom else None,
        primary_inv.warehouse_id if primary_inv else None,
    )), 200


@product_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_product(id):
    print(f"\n--- UPDATE PRODUCT REQUEST RECEIVED FOR ID: {id} ---")
    product = Product.query.get(id)
    if not product:
        print(f"Error: Product {id} not found")
        return jsonify({"error": "Target tracking entity not found."}), 404

    data = request.get_json(silent=True) or {}
    print(f"Update data: {data}")
    
    try:
        if "name" in data: product.name = data["name"].strip()
        if "description" in data: product.description = data["description"].strip() or None
        if "price" in data: product.price = float(data["price"])
        if "brand_id" in data:
            brand_id = int(data["brand_id"])
            if not Brand.query.get(brand_id):
                return jsonify({"error": "Brand not found."}), 404
            product.brand_id = brand_id
        if "category_id" in data: product.category_id = int(data["category_id"])
        if "uom_id" in data: product.uom_id = int(data["uom_id"])
        
        if "discount_percent" in data: product.discount_percent = float(data["discount_percent"])
        
        if "discount_expires_at" in data:
            if data["discount_expires_at"]:
                try:
                    product.discount_expires_at = datetime.strptime(data["discount_expires_at"], "%Y-%m-%d").date()
                except ValueError:
                    return jsonify({"error": "Invalid discount_expires_at format."}), 400
            else:
                product.discount_expires_at = None

        if "expire" in data:
            if data["expire"]:
                try:
                    product.expire = datetime.strptime(data["expire"], "%Y-%m-%d").date()
                except ValueError:
                    print(f"Error: Invalid date format: {data['expire']}")
                    return jsonify({"error": "Invalid expiration timestamp format."}), 400
            else:
                product.expire = None

        # ─── Editable Quantity Logic ───
        initial_qty = data.get("initial_quantity")
        warehouse_id = data.get("warehouse_id")
        if initial_qty is not None and warehouse_id:
            # Find existing record for this product
            inv_record = Inventory.query.filter_by(product_id=id).first()
            if inv_record:
                inv_record.inventory_quantity = int(initial_qty)
                inv_record.warehouse_id = int(warehouse_id)
            else:
                new_inv = Inventory(
                    product_id=id,
                    warehouse_id=int(warehouse_id),
                    inventory_quantity=int(initial_qty)
                )
                db.session.add(new_inv)

        # Handle image updates safely if provided
        if "images" in data:
            print("Processing image updates...")
            try:
                # Simple approach: clear old images and add new ones
                ProductImage.query.filter_by(product_id=id).delete()
                images = data["images"]
                if isinstance(images, list):
                    for i, img_url in enumerate(images):
                        if img_url and str(img_url).strip():
                            new_img = ProductImage(
                                product_id=id,
                                url=str(img_url).strip(),
                                is_primary=(i == 0)
                            )
                            db.session.add(new_img)
            except Exception as e:
                print(f"IMAGE UPDATE WARNING: {str(e)}")
                for obj in list(db.session.new):
                    if isinstance(obj, ProductImage):
                        db.session.expunge(obj)

        print("Finalizing database commit for update...")
        db.session.commit()
        print("--- MASTER PARAMETERS SYNCHRONIZED ---")
        return jsonify({"message": "Master parameters synchronized successfully."}), 200

    except Exception as e:
        db.session.rollback()
        print(f"CRITICAL UPDATE ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Database update failed: {str(e)}"}), 500


@product_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({"error": "Target tracking entity not found."}), 404

    # Check for transaction history
    if OrderDetail.query.filter_by(product_id=id).first() or PurchaseDetail.query.filter_by(product_id=id).first():
        return jsonify({"error": "Cannot delete product with existing transaction history (Orders/Purchases)."}), 400

    # Safe clear inventory tracking records tied to this product to ensure cascades don't lock MySQL
    Inventory.query.filter_by(product_id=id).delete()

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product successfully dropped from system catalog."}), 200


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
    name = data.get("name", "").strip()

    if not name:
        return jsonify({"error": "Category name is required."}), 400

    try:
        if Category.query.filter_by(name=name).first():
            return jsonify({"error": "Category already exists."}), 409

        new_cat = Category(name=name)
        db.session.add(new_cat)
        db.session.commit()
        return jsonify(new_cat.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Database error: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# ─────────────────────────────────────────
# UNIT OF MEASURE ENDPOINTS
# ─────────────────────────────────────────

@unit_bp.route("", methods=["GET"])
@jwt_required()
def get_units():
    units = UnitOfMeasure.query.all()
    return jsonify([u.to_dict() for u in units]), 200
