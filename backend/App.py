import os
from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt
from routes.auth import auth_bp
from routes.product import product_bp, category_bp, unit_bp 
from routes.upload import upload_bp
from routes.inventory import inventory_bp
from routes.supplier import supplier_bp
from routes.purchase import purchase_bp
from routes.customer import customer_bp
from routes.order import order_bp
from routes.dashboard import dashboard_bp
from routes.discount import discount_bp
from routes.wishlist import wishlist_bp
from routes.cart import cart_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow origins from environment variable or default to localhost
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174").split(",")
    
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(category_bp, url_prefix="/api/categories")
    app.register_blueprint(unit_bp, url_prefix="/api/units")
    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
    app.register_blueprint(supplier_bp, url_prefix="/api/suppliers")
    app.register_blueprint(purchase_bp, url_prefix="/api/purchases")
    app.register_blueprint(customer_bp, url_prefix="/api/customers")
    app.register_blueprint(order_bp, url_prefix="/api/orders")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(discount_bp, url_prefix="/api/discount")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5001)
