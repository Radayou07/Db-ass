from App import create_app
from extensions import db
from models import ProductImage
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        # Update all URLs containing :5000/ to :5001/
        db.session.execute(text("UPDATE product_image SET url = REPLACE(url, ':5000/', ':5001/')"))
        db.session.commit()
        print("Successfully updated database image URLs to port 5001.")
    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
