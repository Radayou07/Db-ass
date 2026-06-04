import os
from config import Config
from sqlalchemy import create_engine, text

def run_migrations():
    print("Starting migrations...")
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
    
    with engine.begin() as conn:
        print("1. Adding discount columns to product...")
        try:
            conn.execute(text("ALTER TABLE product ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0;"))
            conn.execute(text("ALTER TABLE product ADD COLUMN discount_expires_at DATE;"))
            print("Product columns added.")
        except Exception as e:
            print(f"Product columns might already exist: {e}")

        print("2. Creating discount table...")
        try:
            conn.execute(text("""
            CREATE TABLE discount (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                type ENUM('percent', 'fixed') NOT NULL,
                value DECIMAL(10,2) NOT NULL,
                min_order DECIMAL(10,2) DEFAULT 0,
                expires_at DATE,
                is_active BOOLEAN DEFAULT TRUE
            );
            """))
            print("Discount table created.")
        except Exception as e:
            print(f"Discount table might already exist: {e}")

        print("3. Creating wishlist table...")
        try:
            conn.execute(text("""
            CREATE TABLE wishlist (
                id INT PRIMARY KEY AUTO_INCREMENT,
                customer_id INT NOT NULL,
                product_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer(id),
                FOREIGN KEY (product_id) REFERENCES product(id),
                UNIQUE (customer_id, product_id)
            );
            """))
            print("Wishlist table created.")
        except Exception as e:
            print(f"Wishlist table might already exist: {e}")

        print("4. Adding discount columns to orders...")
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN discount_id INT REFERENCES discount(id);"))
            conn.execute(text("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;"))
            print("Orders columns added.")
        except Exception as e:
            print(f"Orders columns might already exist: {e}")

    print("Migrations complete.")

if __name__ == "__main__":
    run_migrations()
