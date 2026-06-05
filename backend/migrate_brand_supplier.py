from config import Config
from sqlalchemy import create_engine, text


def table_exists(conn, table_name):
    return conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
            """
        ),
        {"table_name": table_name},
    ).scalar() > 0


def column_exists(conn, table_name, column_name):
    return conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
              AND column_name = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).scalar() > 0


def foreign_keys_for_column(conn, table_name, column_name):
    return conn.execute(
        text(
            """
            SELECT constraint_name
            FROM information_schema.key_column_usage
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
              AND column_name = :column_name
              AND referenced_table_name IS NOT NULL
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).scalars().all()


def index_exists(conn, table_name, index_name):
    return conn.execute(
        text(
            """
            SELECT COUNT(*)
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
              AND index_name = :index_name
            """
        ),
        {"table_name": table_name, "index_name": index_name},
    ).scalar() > 0


def run_migration():
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)

    with engine.begin() as conn:
        print("1. Creating brand table...")
        if not table_exists(conn, "brand"):
            conn.execute(
                text(
                    """
                    CREATE TABLE brand (
                      id INT PRIMARY KEY AUTO_INCREMENT,
                      name VARCHAR(100) NOT NULL,
                      country VARCHAR(100),
                      UNIQUE KEY name (name)
                    )
                    """
                )
            )

        if column_exists(conn, "product", "company"):
            print("2. Backfilling brands from product.company...")
            conn.execute(
                text(
                    """
                    INSERT IGNORE INTO brand (name)
                    SELECT DISTINCT COALESCE(NULLIF(TRIM(company), ''), 'Unknown')
                    FROM product
                    """
                )
            )

        if not column_exists(conn, "product", "brand_id"):
            print("3. Adding product.brand_id...")
            if column_exists(conn, "product", "company"):
                conn.execute(text("ALTER TABLE product ADD COLUMN brand_id INT AFTER company"))
            else:
                conn.execute(text("ALTER TABLE product ADD COLUMN brand_id INT"))

        if column_exists(conn, "product", "company"):
            print("4. Linking existing products to brands...")
            conn.execute(
                text(
                    """
                    UPDATE product p
                    JOIN brand b
                      ON b.name = COALESCE(NULLIF(TRIM(p.company), ''), 'Unknown')
                    SET p.brand_id = b.id
                    WHERE p.brand_id IS NULL
                    """
                )
            )

        if not foreign_keys_for_column(conn, "product", "brand_id"):
            print("5. Adding product.brand_id foreign key...")
            conn.execute(
                text(
                    """
                    ALTER TABLE product
                    ADD CONSTRAINT fk_product_brand
                    FOREIGN KEY (brand_id) REFERENCES brand(id)
                    """
                )
            )

        print("6. Creating supplier_product table...")
        if not table_exists(conn, "supplier_product"):
            conn.execute(
                text(
                    """
                    CREATE TABLE supplier_product (
                      id INT PRIMARY KEY AUTO_INCREMENT,
                      supplier_id INT NOT NULL,
                      product_id INT NOT NULL,
                      unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
                      is_active BOOLEAN DEFAULT TRUE,
                      FOREIGN KEY (supplier_id) REFERENCES supplier(id),
                      FOREIGN KEY (product_id) REFERENCES product(id),
                      UNIQUE KEY uq_supplier_product (supplier_id, product_id)
                    )
                    """
                )
            )

        if column_exists(conn, "product", "supplier_id"):
            print("7. Backfilling supplier_product links from product.supplier_id...")
            conn.execute(
                text(
                    """
                    INSERT IGNORE INTO supplier_product (supplier_id, product_id, unit_price)
                    SELECT supplier_id, id, price
                    FROM product
                    WHERE supplier_id IS NOT NULL
                    """
                )
            )

            print("8. Dropping product.supplier_id foreign keys...")
            for constraint_name in foreign_keys_for_column(conn, "product", "supplier_id"):
                conn.execute(text(f"ALTER TABLE product DROP FOREIGN KEY `{constraint_name}`"))

            print("9. Dropping product.supplier_id...")
            conn.execute(text("ALTER TABLE product DROP COLUMN supplier_id"))

        if column_exists(conn, "product", "company"):
            print("10. Dropping product.company...")
            conn.execute(text("ALTER TABLE product DROP COLUMN company"))

        print("11. Making orders.employee_id nullable...")
        conn.execute(text("ALTER TABLE orders MODIFY COLUMN employee_id INT NULL"))

        if not index_exists(conn, "supplier_product", "uq_supplier_product"):
            conn.execute(
                text(
                    "ALTER TABLE supplier_product ADD UNIQUE KEY uq_supplier_product (supplier_id, product_id)"
                )
            )

    print("Brand/supplier migration complete.")


if __name__ == "__main__":
    run_migration()
