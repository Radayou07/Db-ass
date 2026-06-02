from App import create_app
from extensions import db
from models import Employee

app = create_app()
with app.app_context():
    target_email = "admin@email.com"
    new_password = "123456"

    user = Employee.query.filter_by(email=target_email).first()
    
    if user:
        user.set_password(new_password)
        db.session.commit()
        print(f"✅ Success! Password for {target_email} has been updated to '{new_password}'.")
    else:
        # If the user doesn't exist (e.g. table was cleared again), create them
        print(f"User {target_email} not found. Creating a new admin account...")
        new_admin = Employee(
            name="Admin",
            number="09876543",
            email=target_email,
            role="admin",
            description="System Administrator"
        )
        new_admin.set_password(new_password)
        db.session.add(new_admin)
        db.session.commit()
        print(f"✅ Success! Admin user {target_email} created with password '{new_password}'.")
