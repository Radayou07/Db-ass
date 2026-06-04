import os
from config import Config
from sqlalchemy import create_engine, text

def run_migrations():
    print("Starting cart migrations...")
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
    
    with engine.begin() as conn:
        print("Creating cart table...")
        try:
            conn.execute(text("""
            CREATE TABLE cart (
                id INT PRIMARY KEY AUTO_INCREMENT,
                customer_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customer(id),
                FOREIGN KEY (product_id) REFERENCES product(id),
                UNIQUE (customer_id, product_id)
            );
            """))
            print("Cart table created.")
        except Exception as e:
            print(f"Cart table might already exist: {e}")

    print("Migrations complete.")

if __name__ == "__main__":
    run_migrations()