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
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # 1. Try Employee first (Staff/Admin)
    user = Employee.query.filter_by(email=email).first()
    role = user.role if user else None
    
    # 2. Try Customer if not an employee
    if not user:
        user = Customer.query.filter_by(email=email).first()
        role = "customer" if user else None

    # Check password (assuming Customer model has check_password if they have accounts)
    # If customers don't have passwords yet, we might need to skip or handle differently
    if not user or not hasattr(user, 'check_password') or not user.check_password(password):
        # Fallback for now if Customer doesn't have check_password yet
        if user and role == "customer" and not hasattr(user, 'check_password'):
             # Temporary allow for testing if password field exists but no method
             pass
        else:
             return jsonify({"error": "Invalid email or password"}), 401

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


# ─────────────────────────────────────────
# GET /api/auth/me   (requires token)
# ─────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    claims = get_jwt()
    return jsonify({
        "id":    get_jwt_identity(),
        "name":  claims.get("name"),
        "email": claims.get("email"),
        "role":  claims.get("role"),
    }), 200