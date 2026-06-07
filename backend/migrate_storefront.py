import os
from config import Config
from sqlalchemy import create_engine, text

def run_migrations():
    print("Starting storefront migrations...")
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
    
    with engine.begin() as conn:
        print("Creating storefront_banner table...")
        try:
            conn.execute(text("""
            CREATE TABLE storefront_banner (
                id INT PRIMARY KEY AUTO_INCREMENT,
                image_url VARCHAR(255) NOT NULL,
                title_text VARCHAR(100),
                subtitle_text VARCHAR(100),
                link_url VARCHAR(255),
                display_order INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            );
            """))
            print("StorefrontBanner table created.")
        except Exception as e:
            print(f"StorefrontBanner table might already exist: {e}")

        print("Creating storefront_config table...")
        try:
            conn.execute(text("""
            CREATE TABLE storefront_config (
                id INT PRIMARY KEY,
                side_promo_title VARCHAR(100),
                side_promo_subtitle VARCHAR(100),
                side_promo_link VARCHAR(255),
                side_promo_image_url VARCHAR(255)
            );
            """))
            conn.execute(text("""
            INSERT INTO storefront_config (id, side_promo_title, side_promo_subtitle, side_promo_link, side_promo_image_url)
            VALUES (1, 'Huge Sale', '70% OFF', '/customer/products', NULL);
            """))
            print("StorefrontConfig table created and initialized.")
        except Exception as e:
            print(f"StorefrontConfig table might already exist: {e}")

    print("Migrations complete.")

if __name__ == "__main__":
    run_migrations()
