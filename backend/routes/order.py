from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import Orders, OrderDetail, Product, Inventory, Employee, PaymentCustomer
from datetime import datetime

order_bp = Blueprint("order", __name__)

@order_bp.route("", methods=["GET"])
@jwt_required()
def get_orders():
    claims = get_jwt()
    user_id = int(get_jwt_identity()) 

    if claims.get("role") == "customer":
        orders = Orders.query.filter_by(customer_id=user_id).all()
    else:
        orders = Orders.query.all()

    results = []
    for o in orders:
        order_dict = o.to_dict()
        order_dict["customer_name"] = o.customer.name if o.customer else "Unknown"
        
        payment_record = PaymentCustomer.query.filter_by(order_id=o.id, status=1).first()
        order_dict["payment_status"] = 1 if payment_record else 0
        order_dict["payment_method"] = payment_record.method if payment_record else None
        
        order_dict["details"] = [d.to_dict() for d in o.details]
        results.append(order_dict)
    return jsonify(results), 200

@order_bp.route("", methods=["POST"])
@jwt_required()
def create_order():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    role = claims.get("role")
    
    try:
        # 1. Context determination
        if role == "customer":
            customer_id = user_id
            employee_id = None
            payment_employee_id = None
            method = "Transfer" # Customers always pay via Transfer (QR)
            
            # Read from cart
            from models import Cart
            cart_items = Cart.query.filter_by(customer_id=customer_id).all()
            if not cart_items:
                return jsonify({"error": "Cart is empty."}), 400
                
            items = []
            for item in cart_items:
                items.append({"product_id": item.product_id, "quantity": item.quantity})
        else:
            customer_id = data.get("customer_id")
            employee_id = user_id
            payment_employee_id = user_id
            if not customer_id:
                 return jsonify({"error": "Customer ID is required for staff-led orders."}), 400
            customer_id = int(customer_id)
            # Staff can specify method, default to Cash
            method = data.get("payment_method", "Cash")
            if method not in ['Cash', 'Credit card', 'Transfer']:
                method = "Cash"
                
            items = data.get("items", []) 
            if not items:
                return jsonify({"error": "No items provided."}), 400

        discount_id = data.get("discount_id")
        discount_amount = float(data.get("discount_amount", 0))

        new_order = Orders(
            customer_id=customer_id, 
            employee_id=employee_id, 
            date=datetime.utcnow().date(),
            discount_id=discount_id,
            discount_amount=discount_amount
        )
        db.session.add(new_order)
        db.session.flush()

        subtotal = 0
        for item in items:
            pid = int(item["product_id"])
            qty = int(item["quantity"])
            product = Product.query.get(pid)
            if not product: continue
            
            # Check total available stock across all inventory records
            total_stock = db.session.query(db.func.sum(Inventory.inventory_quantity)).filter_by(product_id=pid).scalar() or 0
            if total_stock < qty:
                return jsonify({"error": f"Insufficient stock for {product.name}. Available: {total_stock}"}), 400

            # Use sale_price logic
            sale_price = float(product.price)
            if product.discount_percent and float(product.discount_percent) > 0:
                if not product.discount_expires_at or product.discount_expires_at >= datetime.utcnow().date():
                    sale_price = float(product.price) * (1 - float(product.discount_percent) / 100)
                    
            item_price = round(sale_price, 2)
            subtotal += (item_price * qty)
            
            # Stock deduction
            try:
                inventory_records = Inventory.query.filter_by(product_id=pid).filter(Inventory.inventory_quantity > 0).all()
                rem = qty
                for inv in inventory_records:
                    if rem <= 0: break
                    take = min(inv.inventory_quantity, rem)
                    inv.inventory_quantity -= take
                    rem -= take
            except: pass

            detail = OrderDetail(order_id=new_order.id, product_id=pid, quantity=qty, price=item_price)
            db.session.add(detail)

        final_total = max(0, subtotal - discount_amount)

        # 4. Immediate Payment
        if data.get("paid", False):
            if payment_employee_id is None:
                system_emp = Employee.query.first()
                if not system_emp:
                    return jsonify({"error": "No staff member available to record payment."}), 500
                payment_employee_id = system_emp.id

            new_payment = PaymentCustomer(
                order_id=new_order.id,
                amount=final_total,
                method=method,
                status=1,
                employee_id=payment_employee_id,
                date=datetime.utcnow().date()
            )
            db.session.add(new_payment)
            
        # Clear Cart
        if role == "customer":
            from models import Cart
            Cart.query.filter_by(customer_id=customer_id).delete()

        db.session.commit()
        return jsonify({"message": "Order processed.", "id": new_order.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@order_bp.route("/<int:id>/pay", methods=["POST"])
@jwt_required()
def pay_order(id):
    claims = get_jwt()
    role = claims.get("role")
    data = request.get_json(silent=True) or {}
    
    order = Orders.query.get(id)
    if not order: return jsonify({"error": "Order not found"}), 404
    
    if PaymentCustomer.query.filter_by(order_id=id, status=1).first():
        return jsonify({"error": "Already paid"}), 400
    
    subtotal = sum(float(d.price) * d.quantity for d in order.details)
    discount_amount = float(order.discount_amount) if order.discount_amount else 0
    final_total = max(0, subtotal - discount_amount)
    
    # Role based method logic
    if role == "customer":
        method = "Transfer"
        system_emp = Employee.query.first()
        if not system_emp:
            return jsonify({"error": "No staff member available to record payment."}), 500
        employee_id = system_emp.id
    else:
        method = data.get("payment_method", "Cash")
        if method not in ['Cash', 'Credit card', 'Transfer']:
            method = "Cash"
        employee_id = int(get_jwt_identity())
    
    new_payment = PaymentCustomer(
        order_id=id,
        amount=final_total,
        method=method,
        status=1,
        employee_id=employee_id,
        date=datetime.utcnow().date()
    )
    db.session.add(new_payment)
    db.session.commit()
    
    return jsonify({"message": "Paid", "order_id": id, "method": method}), 200

@order_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_order(id):
    order = Orders.query.get(id)
    if not order: return jsonify({"error": "Order not found"}), 404
    
    # Check if order is already paid - optional, but good for logic
    if PaymentCustomer.query.filter_by(order_id=id, status=1).first():
        # Maybe don't allow cancelling paid orders? Or handle refund.
        pass

    # 1. Restore Inventory Stock
    for detail in order.details:
        pid = detail.product_id
        qty = detail.quantity
        
        # Try to find the last inventory record for this product to put stock back into
        inv = Inventory.query.filter_by(product_id=pid).order_by(Inventory.id.desc()).first()
        if inv:
            inv.inventory_quantity += qty
        else:
            # If no inventory record exists (shouldn't happen), create a dummy one
            # or skip. Best to put back into the most recent one.
            pass

    # 2. Cleanup
    OrderDetail.query.filter_by(order_id=id).delete()
    PaymentCustomer.query.filter_by(order_id=id).delete()
    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order cancelled and stock restored."}), 200
