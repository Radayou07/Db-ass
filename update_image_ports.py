import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "07102005")
DB_NAME = os.getenv("DB_NAME", "inventory_control_management")

try:
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    cursor = conn.cursor()
    
    # Update product_image URLs
    query = "UPDATE product_image SET url = REPLACE(url, ':5000/', ':5001/')"
    cursor.execute(query)
    rows_updated = cursor.rowcount
    
    conn.commit()
    print(f"Successfully updated {rows_updated} image URLs from port 5000 to 5001.")
    
    conn.close()
except Exception as e:
    print(f"Error updating database: {e}")
