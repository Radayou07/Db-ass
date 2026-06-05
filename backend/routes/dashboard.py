from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from extensions import db
from models import Product, Orders, Inventory, Customer, OrderDetail, Supplier, Purchase, PurchaseDetail
from sqlalchemy import func
from datetime import date

dashboard_bp = Blueprint("dashboard", __name__)

def add_months(source_date, months):
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    return date(year, month, 1)

def sales_vs_purchases_data(month_count=6):
    today = date.today()
    first_month = add_months(date(today.year, today.month, 1), -(month_count - 1))
    months = [add_months(first_month, idx) for idx in range(month_count)]
    buckets = {
        month.strftime("%Y-%m"): {
            "month": month.strftime("%b"),
            "sales": 0.0,
            "purchases": 0.0,
        }
        for month in months
    }

    sales_rows = db.session.query(
        Orders.date,
        OrderDetail.quantity,
        OrderDetail.price,
    ).join(OrderDetail, Orders.id == OrderDetail.order_id)\
     .filter(Orders.date >= first_month)\
     .all()

    for order_date, quantity, price in sales_rows:
        key = order_date.strftime("%Y-%m")
        if key in buckets:
            buckets[key]["sales"] += float(price) * int(quantity)

    purchase_rows = db.session.query(
        Purchase.date,
        PurchaseDetail.quantity,
        PurchaseDetail.price,
    ).join(PurchaseDetail, Purchase.id == PurchaseDetail.purchase_id)\
     .filter(Purchase.date >= first_month)\
     .filter(Purchase.status != "cancelled")\
     .all()

    for purchase_date, quantity, price in purchase_rows:
        key = purchase_date.strftime("%Y-%m")
        if key in buckets:
            buckets[key]["purchases"] += float(price) * int(quantity)

    return [
        {
            **bucket,
            "sales": round(bucket["sales"], 2),
            "purchases": round(bucket["purchases"], 2),
            "income": round(bucket["sales"], 2),
            "outcome": round(bucket["purchases"], 2),
        }
        for bucket in buckets.values()
    ]

@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    # 1. Basic counts
    total_products = Product.query.count()
    total_orders = Orders.query.count()
    total_customers = Customer.query.count()
    total_suppliers = Supplier.query.count()

    # 2. Total stock across all warehouses
    total_stock = db.session.query(func.sum(Inventory.inventory_quantity)).scalar() or 0

    # 3. Out of stock products
    # First, get total stock per product
    stock_per_product = db.session.query(
        Inventory.product_id,
        func.sum(Inventory.inventory_quantity).label("total")
    ).group_by(Inventory.product_id).subquery()

    # Find products not in stock_per_product or with total <= 0
    # This is a bit complex, let's simplify for the dashboard
    out_of_stock_count = Product.query.outerjoin(stock_per_product, Product.id == stock_per_product.c.product_id)\
        .filter((stock_per_product.c.total == None) | (stock_per_product.c.total <= 0)).count()

    # 4. Top Customers (by order count)
    top_customers_query = db.session.query(
        Customer.name,
        func.count(Orders.id).label("order_count")
    ).join(Orders, Customer.id == Orders.customer_id)\
     .group_by(Customer.id)\
     .order_by(func.count(Orders.id).desc())\
     .limit(5).all()

    top_customers = [{"name": name, "orders": count} for name, count in top_customers_query]

    # 5. Top Products (by units sold)
    top_products_query = db.session.query(
        Product.name,
        func.sum(OrderDetail.quantity).label("sold_count")
    ).join(OrderDetail, Product.id == OrderDetail.product_id)\
     .group_by(Product.id)\
     .order_by(func.sum(OrderDetail.quantity).desc())\
     .limit(10).all()
    
    # Calculate percentages for the UI progress bars relative to the top seller
    max_sold = top_products_query[0][1] if top_products_query else 1
    top_products = [
        {"name": name, "sold": int(count), "pct": int((count/max_sold)*100)} 
        for name, count in top_products_query
    ]

    return jsonify({
        "counts": {
            "products": total_products,
            "orders": total_orders,
            "customers": total_customers,
            "suppliers": total_suppliers,
            "total_stock": int(total_stock),
            "out_of_stock": out_of_stock_count
        },
        "top_customers": top_customers,
        "top_products": top_products,
        "sales_vs_purchases": sales_vs_purchases_data()
    }), 200

@dashboard_bp.route("/sales-vs-purchases", methods=["GET"])
@jwt_required()
def get_sales_vs_purchases():
    return jsonify(sales_vs_purchases_data()), 200
