from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func
from extensions import db
from models import Product, Category, Inventory, ProductImage, Warehouse, UnitOfMeasure, OrderDetail, Purchase, PurchaseDetail
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
     .outerjoin(UnitOfMeasure, Product.uom_id == UnitOfMeasure.id)\
     .outerjoin(stock_sub, Product.id == stock_sub.c.product_id)

    results = query.all()
    
    product_list = []
    for product, cat_name, total_stock, uom_name, uom_abbr in results:
        # Get last purchase cost
        last_purchase = PurchaseDetail.query.filter_by(product_id=product.id)\
            .join(Purchase)\
            .order_by(Purchase.date.desc(), Purchase.id.desc())\
            .first()
        last_cost = float(last_purchase.price) if last_purchase else 0

        # Safely handle images if table doesn't exist yet
        try:
            images = [img.to_dict() for img in product.images]
        except:
            images = []

        product_list.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "last_cost": last_cost,
            "company": product.company,
            "expire": product.expire.isoformat() if product.expire else None,
            "category_id": product.category_id,
            "category_name": cat_name,
            "uom_id": product.uom_id,
            "uom_name": uom_name,
            "uom_abbreviation": uom_abbr,
            "stock": int(total_stock) if total_stock is not None else 0,
            "supplier_id": product.supplier_id,
            "supplier_name": product.supplier.name if product.supplier else "No Supplier",
            "images": [{**img, "url": img["url"].replace(":5000/", ":5001/")} for img in images]
        })

    return jsonify(product_list), 200


@product_bp.route("", methods=["POST"])
@jwt_required()
def create_product():
    print("\n--- CREATE PRODUCT REQUEST RECEIVED ---")
    data = request.get_json(silent=True) or {}
    print(f"Input data: {data}")
    
    try:
        name = data.get("name", "").strip()
        price = data.get("price")
        category_id = data.get("category_id")
        uom_id = data.get("uom_id")

        if not name or price is None or not category_id or not uom_id:
            print("Error: Missing required fields")
            return jsonify({"error": "Missing parameters: name, price, category_id, and uom_id are required."}), 400

        expire_date = None
        if data.get("expire"):
            try:
                expire_date = datetime.strptime(data["expire"], "%Y-%m-%d").date()
            except ValueError:
                print(f"Error: Invalid date format: {data['expire']}")
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

        discount_expires_at = None
        if data.get("discount_expires_at"):
            try:
                discount_expires_at = datetime.strptime(data["discount_expires_at"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Invalid discount_expires_at format. Use YYYY-MM-DD."}), 400

        print(f"Creating product object: name={name}, price={price}, cat={category_id}, uom={uom_id}")
        new_product = Product(
            name=name,
            description=data.get("description", "").strip() or None,
            price=float(price),
            company=data.get("company", "Unknown").strip() or "Unknown",
            expire=expire_date,
            category_id=int(category_id),
            uom_id=int(uom_id),
            supplier_id=data.get("supplier_id"),
            discount_percent=data.get("discount_percent", 0),
            discount_expires_at=discount_expires_at
        )

        print("Adding product to session...")
        db.session.add(new_product)
        
        # Handle initial quantity
        initial_qty = data.get("initial_quantity")
        warehouse_id = data.get("warehouse_id")
        if initial_qty is not None and warehouse_id:
            try:
                db.session.flush() # ensure product.id is available
                new_inv = Inventory(
                    product_id=new_product.id,
                    warehouse_id=int(warehouse_id),
                    inventory_quantity=int(initial_qty)
                )
                db.session.add(new_inv)
                print(f"Initial stock added: {initial_qty} units in warehouse {warehouse_id}")
            except Exception as e:
                print(f"Inventory initialization warning: {str(e)}")
        
        # Handle optional image URLs safely
        images = data.get("images", [])
        if isinstance(images, list) and len(images) > 0:
            print(f"Attempting to save {len(images)} images...")
            try:
                db.session.flush()
                print(f"Assigned ID: {new_product.id}")
                for i, img_url in enumerate(images):
                    if img_url and str(img_url).strip():
                        new_img = ProductImage(
                            product_id=new_product.id,
                            url=str(img_url).strip(),
                            is_primary=(i == 0)
                        )
                        db.session.add(new_img)
            except Exception as e:
                print(f"IMAGE TABLE WARNING: {str(e)}")
                for obj in list(db.session.new):
                    if isinstance(obj, ProductImage):
                        db.session.expunge(obj)

        print("Finalizing database commit...")
        db.session.commit()
        print("--- PRODUCT LOGGED SUCCESSFULLY ---")
        return jsonify({"message": "Product logged successfully.", "id": new_product.id}), 201

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

    try:
        images = [img.to_dict() for img in product.images]
    except:
        images = []

    # Get primary warehouse record if it exists
    primary_inv = Inventory.query.filter_by(product_id=id).first()

    # Get last purchase cost
    last_purchase = PurchaseDetail.query.filter_by(product_id=id)\
        .join(Purchase)\
        .order_by(Purchase.date.desc(), Purchase.id.desc())\
        .first()
    last_cost = float(last_purchase.price) if last_purchase else 0

    return jsonify({
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "last_cost": last_cost,
        "company": product.company,
        "expire": product.expire.isoformat() if product.expire else None,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "uom_id": product.uom_id,
        "uom_name": product.uom.name if product.uom else None,
        "uom_abbreviation": product.uom.abbreviation if product.uom else None,
        "stock": int(stock_sum) if stock_sum is not None else 0,
        "warehouse_id": primary_inv.warehouse_id if primary_inv else None,
        "supplier_id": product.supplier_id,
        "supplier_name": product.supplier.name if product.supplier else "No Supplier",
        "images": [{**img, "url": img["url"].replace(":5000/", ":5001/")} for img in images]
    }), 200


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
        if "company" in data: product.company = data["company"].strip() or "Unknown"
        if "category_id" in data: product.category_id = int(data["category_id"])
        if "uom_id" in data: product.uom_id = int(data["uom_id"])
        if "supplier_id" in data: product.supplier_id = data["supplier_id"]
        
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
