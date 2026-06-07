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
from routes.brand import brand_bp
from routes.storefront import storefront_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Disable strict slashes globally to prevent 405 on trailing slash redirects
    app.url_map.strict_slashes = False

    # Allow origins from environment variable or default to local development ports
    # In production, this should include your frontend's Render URL
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if "*" in allowed_origins:
            allowed_origins = "*"

    CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)
    
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
    app.register_blueprint(brand_bp, url_prefix="/api/brands")
    app.register_blueprint(storefront_bp, url_prefix="/api/storefront")

    @app.route("/")
    def index():
        return {"message": "Inventory API is running", "status": "success"}

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(debug=False, host="0.0.0.0", port=port)
