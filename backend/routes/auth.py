from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from extensions import db
from models import Employee, Customer

auth_bp = Blueprint("auth", __name__)


# ─────────────────────────────────────────
# POST /api/auth/login
# Body: { email, password }
# ─────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = data.get("email", "").strip().lower() # This can be email or phone number
    password   = data.get("password", "")

    print(f"[DEBUG] Login attempt for identifier: '{identifier}'")

    if not identifier or not password:
        return jsonify({"error": "Identifier (email/phone) and password are required"}), 400

    # 1. Try Employee first (Staff/Admin) - Search by email OR phone number
    user = Employee.query.filter(
        (Employee.email == identifier) | (Employee.number == identifier)
    ).first()
    
    if user:
        print(f"[DEBUG] Found employee: {user.name} (Role: {user.role})")
    else:
        print(f"[DEBUG] No employee found with identifier '{identifier}'")

    role = user.role if user else None
    
    # 2. Try Customer if not an employee - Search by email OR phone number
    if not user:
        user = Customer.query.filter(
            (Customer.email == identifier) | (Customer.number == identifier)
        ).first()
        if user:
            print(f"[DEBUG] Found customer: {user.name}")
        role = "customer" if user else None

    # Check password
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
        
    if not hasattr(user, 'check_password'):
        print(f"[DEBUG] User object has no check_password method")
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.check_password(password):
        print(f"[DEBUG] Password check failed for user: {user.email}")
        return jsonify({"error": "Invalid email or password"}), 401

    print(f"[DEBUG] Login successful for: {user.email}")

    # Embed role + name in the token
    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role":  role,
            "name":  user.name,
            "email": user.email,
        },
    )

    return jsonify({"token": token, "user": user.to_dict(), "role": role}), 200


# ─────────────────────────────────────────
# POST /api/auth/register (PUBLIC)
# Body: { name, number, email, address, password }
# Creates a CUSTOMER account.
# ─────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    required = ["name", "number", "email", "address"]
    for field in required:
        if not data.get(field, "").strip():
            return jsonify({"error": f"'{field}' is required"}), 400

    email = data["email"].strip().lower()
    number = data["number"].strip()

    # Check both tables
    if Customer.query.filter_by(email=email).first() or Employee.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered"}), 409

    if Customer.query.filter_by(number=number).first() or Employee.query.filter_by(number=number).first():
        return jsonify({"error": "Phone number is already registered"}), 409

    new_customer = Customer(
        name=data["name"].strip(),
        number=data["number"].strip(),
        email=email,
        address=data["address"].strip()
    )
    if data.get("password"):
        new_customer.set_password(data["password"])

    db.session.add(new_customer)
    db.session.commit()

    return jsonify({
        "message": "Customer account created successfully",
        "user": new_customer.to_dict(),
    }), 201


# ─────────────────────────────────────────
# POST /api/auth/staff (ADMIN ONLY)
# Body: { name, number, email, password, role }
# ─────────────────────────────────────────
@auth_bp.route("/staff", methods=["POST"])
@jwt_required()
def add_staff():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Administrative elevation required"}), 403

    data = request.get_json(silent=True) or {}

    required = ["name", "number", "email", "password", "role"]
    for field in required:
        if not data.get(field, "").strip():
            return jsonify({"error": f"'{field}' is required"}), 400

    if Employee.query.filter_by(email=data["email"].strip().lower()).first():
        return jsonify({"error": "Staff email already exists"}), 409

    new_staff = Employee(
        name=data["name"].strip(),
        number=data["number"].strip(),
        email=data["email"].strip().lower(),
        role=data["role"]
    )
    new_staff.set_password(data["password"])

    db.session.add(new_staff)
    db.session.commit()

    return jsonify({"message": "Staff member enrolled successfully"}), 201


@auth_bp.route("/staff", methods=["GET"])
@jwt_required()
def get_staff():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Administrative elevation required"}), 403

    staff_list = Employee.query.all()
    return jsonify([s.to_dict() for s in staff_list]), 200


@auth_bp.route("/staff/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_staff(id):
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Administrative elevation required"}), 403

    # Prevent admin from deleting themselves
    if str(id) == get_jwt_identity():
        return jsonify({"error": "Self-deletion is prohibited"}), 400

    staff = Employee.query.get(id)
    if not staff:
        return jsonify({"error": "Staff member not found"}), 404

    db.session.delete(staff)
    db.session.commit()
    return jsonify({"message": "Staff member removed"}), 200


# ─────────────────────────────────────────
# GET /api/auth/me   (requires token)
# ─────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    claims = get_jwt()
    # Fetch fresh data from DB to include description
    role = claims.get("role")
    user_id = get_jwt_identity()
    
    if role in ["admin", "staff"]:
        user = Employee.query.get(user_id)
    else:
        user = Customer.query.get(user_id)
        
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify(user.to_dict()), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    data = request.get_json(silent=True) or {}
    
    if role in ["admin", "staff"]:
        user = Employee.query.get(user_id)
    else:
        user = Customer.query.get(user_id)
        
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if "name" in data:
        user.name = data["name"].strip()
    if "description" in data:
        user.description = data["description"].strip()
    if "number" in data:
        user.number = data["number"].strip()
        
    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200