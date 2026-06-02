import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required
from extensions import db
from models import Supplier, SupplierNumber, SupplierImage, Purchase, PurchaseDetail

supplier_bp = Blueprint("supplier", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@supplier_bp.route("", methods=["GET"])
@jwt_required()
def get_suppliers():
    suppliers = Supplier.query.all()
    return jsonify([s.to_dict() for s in suppliers]), 200

@supplier_bp.route("", methods=["POST"])
@jwt_required()
def create_supplier():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    numbers = data.get("numbers", []) # Expecting a list of strings
    email = data.get("email", "").strip()
    address = data.get("address", "").strip()
    images = data.get("images", []) # Expecting a list of image URLs

    if not name or not numbers or not email or not address:
        return jsonify({"error": "Name, numbers, email, and address are required."}), 400

    if isinstance(numbers, str):
        numbers = [numbers]

    try:
        new_supplier = Supplier(name=name, email=email, address=address)
        db.session.add(new_supplier)
        db.session.flush() # Get supplier ID

        for num in numbers:
            if num.strip():
                db.session.add(SupplierNumber(supplier_id=new_supplier.id, number=num.strip()))

        # Handle images
        if isinstance(images, list):
            for i, img_url in enumerate(images):
                if img_url and str(img_url).strip():
                    new_img = SupplierImage(
                        supplier_id=new_supplier.id,
                        url=str(img_url).strip(),
                        is_primary=(i == 0)
                    )
                    db.session.add(new_img)

        db.session.commit()
        return jsonify(new_supplier.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    data = request.get_json(silent=True) or {}
    try:
        if "name" in data: supplier.name = data["name"].strip()
        if "email" in data: supplier.email = data["email"].strip()
        if "address" in data: supplier.address = data["address"].strip()

        if "numbers" in data:
            numbers = data["numbers"]
            if isinstance(numbers, str):
                numbers = [numbers]
            
            # Simple sync: remove old, add new
            SupplierNumber.query.filter_by(supplier_id=id).delete()
            for num in numbers:
                if num.strip():
                    db.session.add(SupplierNumber(supplier_id=id, number=num.strip()))

        # Handle image updates
        if "images" in data:
            images = data["images"]
            if isinstance(images, list):
                # Clear old images and add new ones
                SupplierImage.query.filter_by(supplier_id=id).delete()
                for i, img_url in enumerate(images):
                    if img_url and str(img_url).strip():
                        new_img = SupplierImage(
                            supplier_id=id,
                            url=str(img_url).strip(),
                            is_primary=(i == 0)
                        )
                        db.session.add(new_img)

        db.session.commit()
        return jsonify(supplier.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@supplier_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    # Check for transaction history
    if Purchase.query.filter_by(supplier_id=id).first():
        return jsonify({"error": "Cannot delete supplier with active purchase history."}), 400

    db.session.delete(supplier)
    db.session.commit()
    return jsonify({"message": "Supplier removed successfully."}), 200

@supplier_bp.route("/<int:id>/image", methods=["POST"])
@jwt_required()
def update_supplier_image(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404

    if 'image' not in request.files:
        return jsonify({"error": "No image part"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f"supplier_{id}_{uuid.uuid4().hex}.{ext}")

        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        url = f"http://localhost:5001/static/uploads/{filename}"

        # Set all other images to not primary
        SupplierImage.query.filter_by(supplier_id=id).update({"is_primary": False})
        new_img = SupplierImage(supplier_id=id, url=url, is_primary=True)
        db.session.add(new_img)
        db.session.commit()

        return jsonify({"message": "Supplier image updated", "supplier": supplier.to_dict()}), 200

    return jsonify({"error": "Invalid file type"}), 400

@supplier_bp.route("/<int:id>/purchases", methods=["GET"])
@jwt_required()
def get_supplier_purchases(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({"error": "Supplier not found"}), 404
    
    purchases = Purchase.query.filter_by(supplier_id=id).all()
    results = []
    for purchase in purchases:
        purchase_data = purchase.to_dict()
        # Add summary info
        details = PurchaseDetail.query.filter_by(purchase_id=purchase.id).all()
        purchase_data["total_items"] = sum(d.quantity for d in details)
        purchase_data["total_amount"] = sum(float(d.price) * d.quantity for d in details)
        results.append(purchase_data)
        
    return jsonify(results), 200
