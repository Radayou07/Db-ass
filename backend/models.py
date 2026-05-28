from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime


class Employee(db.Model):
    __tablename__ = "employee"

    id            = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    name          = db.Column(db.String(100), nullable=False)
    number        = db.Column(db.String(45),  nullable=False, unique=True)
    email         = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.Enum("admin", "staff"), nullable=False, default="staff")
    description   = db.Column(db.Text, nullable=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id":    self.id,
            "name":  self.name,
            "number": self.number,
            "email": self.email,
            "role":  self.role,
            "description": self.description,
        }


class Category(db.Model):
    __tablename__ = "category"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name        = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }


class UnitOfMeasure(db.Model):
    __tablename__ = "unit_of_measure"

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name         = db.Column(db.String(50), nullable=False, unique=True)
    abbreviation = db.Column(db.String(10), nullable=False, unique=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "abbreviation": self.abbreviation
        }


class Product(db.Model):
    __tablename__ = "product"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name        = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price       = db.Column(db.Numeric(10, 2), nullable=False)
    company     = db.Column(db.String(100), nullable=False)
    expire      = db.Column(db.Date, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=False)
    uom_id      = db.Column(db.Integer, db.ForeignKey("unit_of_measure.id"), nullable=True)

    # Relationships
    category = db.relationship("Category", backref=db.backref("products", lazy=True))
    uom      = db.relationship("UnitOfMeasure", backref=db.backref("products", lazy=True))
    images   = db.relationship("ProductImage", backref="product", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "company": self.company,
            "expire": self.expire.isoformat() if self.expire else None,
            "category_id": self.category_id,
            "uom_id": self.uom_id,
            "uom_name": self.uom.name if self.uom else None,
            "uom_abbreviation": self.uom.abbreviation if self.uom else None
        }


class ProductImage(db.Model):
    __tablename__ = "product_image"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id  = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    url         = db.Column(db.String(255), nullable=False)
    is_primary  = db.Column(db.Boolean, nullable=False, default=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "is_primary": self.is_primary,
            "uploaded_at": self.uploaded_at.isoformat()
        }


class Warehouse(db.Model):
    __tablename__ = "warehouse"

    id       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name     = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "capacity": self.capacity
        }


class Inventory(db.Model):
    __tablename__ = "inventory"

    id                 = db.Column(db.Integer, primary_key=True, autoincrement=True)
    inventory_quantity = db.Column(db.Integer, nullable=False, default=0)
    last_update        = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    product_id         = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    warehouse_id       = db.Column(db.Integer, db.ForeignKey("warehouse.id"), nullable=False)

    # Relationships
    product   = db.relationship("Product", backref=db.backref("inventory_records", lazy=True))
    warehouse = db.relationship("Warehouse", backref=db.backref("inventory_records", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "inventory_quantity": self.inventory_quantity,
            "last_update": self.last_update.isoformat(),
            "product_id": self.product_id,
            "warehouse_id": self.warehouse_id
        }


class Customer(db.Model):
    __tablename__ = "customer"

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name          = db.Column(db.String(100), nullable=False)
    number        = db.Column(db.String(45), nullable=False, unique=True)
    email         = db.Column(db.String(100), nullable=True, unique=True)
    password_hash = db.Column(db.String(255), nullable=True)
    address       = db.Column(db.String(255), nullable=False)
    description   = db.Column(db.Text, nullable=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash: return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "number": self.number,
            "email": self.email,
            "address": self.address,
            "description": self.description,
            "role": "customer"
        }


class Supplier(db.Model):
    __tablename__ = "supplier"

    id      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name    = db.Column(db.String(100), nullable=False)
    number  = db.Column(db.String(45), nullable=False, unique=True)
    email   = db.Column(db.String(100), nullable=False, unique=True)
    address = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "number": self.number,
            "email": self.email,
            "address": self.address
        }


class Orders(db.Model):
    __tablename__ = "orders"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date        = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)

    customer = db.relationship("Customer", backref=db.backref("orders", lazy=True))
    employee = db.relationship("Employee", backref=db.backref("processed_orders", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "customer_id": self.customer_id,
            "employee_id": self.employee_id
        }


class OrderDetail(db.Model):
    __tablename__ = "order_detail"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quantity   = db.Column(db.Integer, nullable=False)
    price      = db.Column(db.Numeric(10, 2), nullable=False)
    order_id   = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)

    order   = db.relationship("Orders", backref=db.backref("details", lazy=True))
    product = db.relationship("Product", backref=db.backref("order_details", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "quantity": self.quantity,
            "price": float(self.price),
            "order_id": self.order_id,
            "product_id": self.product_id
        }


class Purchase(db.Model):
    __tablename__ = "purchase"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date        = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    note        = db.Column(db.String(255), nullable=True)
    status      = db.Column(db.Enum('pending', 'received', 'cancelled'), nullable=False, default='pending')
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)

    supplier = db.relationship("Supplier", backref=db.backref("purchases", lazy=True))
    employee = db.relationship("Employee", backref=db.backref("processed_purchases", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "note": self.note,
            "status": self.status,
            "supplier_id": self.supplier_id,
            "employee_id": self.employee_id
        }


class PurchaseDetail(db.Model):
    __tablename__ = "purchase_detail"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    price       = db.Column(db.Numeric(10, 2), nullable=False)
    quantity    = db.Column(db.Integer, nullable=False)
    purchase_id = db.Column(db.Integer, db.ForeignKey("purchase.id"), nullable=False)
    product_id  = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)

    purchase = db.relationship("Purchase", backref=db.backref("details", lazy=True))
    product  = db.relationship("Product", backref=db.backref("purchase_details", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "price": float(self.price),
            "quantity": self.quantity,
            "purchase_id": self.purchase_id,
            "product_id": self.product_id
        }


class PaymentCustomer(db.Model):
    __tablename__ = "payment_customer"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date        = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    amount      = db.Column(db.Numeric(10, 2), nullable=False)
    status      = db.Column(db.Integer, nullable=False, default=0) # 0=unpaid, 1=paid
    method      = db.Column(db.Enum('Cash', 'Credit card', 'Transfer'), nullable=False)
    order_id    = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)

    order    = db.relationship("Orders", backref=db.backref("payments", lazy=True))
    employee = db.relationship("Employee", backref=db.backref("customer_payments", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "amount": float(self.amount),
            "status": self.status,
            "method": self.method,
            "order_id": self.order_id,
            "employee_id": self.employee_id
        }


class PaymentSupplier(db.Model):
    __tablename__ = "payment_supplier"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date        = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    amount      = db.Column(db.Numeric(10, 2), nullable=False)
    status      = db.Column(db.Integer, nullable=False, default=0) # 0=unpaid, 1=paid
    method      = db.Column(db.Enum('Cash', 'Credit card', 'Transfer'), nullable=False)
    purchase_id = db.Column(db.Integer, db.ForeignKey("purchase.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)

    purchase = db.relationship("Purchase", backref=db.backref("payments", lazy=True))
    employee = db.relationship("Employee", backref=db.backref("supplier_payments", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "amount": float(self.amount),
            "status": self.status,
            "method": self.method,
            "purchase_id": self.purchase_id,
            "employee_id": self.employee_id
        }
