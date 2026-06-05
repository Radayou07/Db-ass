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

    # Relationships
    images = db.relationship("EmployeeImage", backref="employee", cascade="all, delete-orphan", lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        primary_image = next((img.url for img in self.images if img.is_primary), None)
        if not primary_image and self.images:
            primary_image = self.images[0].url
            
        if primary_image:
            primary_image = primary_image.replace(":5000/", ":5001/")

        return {
            "id":    self.id,
            "name":  self.name,
            "number": self.number,
            "email": self.email,
            "role":  self.role,
            "description": self.description,
            "image_url": primary_image
        }


class EmployeeImage(db.Model):
    __tablename__ = "employee_image"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=False)
    url         = db.Column(db.String(255), nullable=False)
    is_primary  = db.Column(db.Boolean, nullable=False, default=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url.replace(":5000/", ":5001/"),
            "is_primary": self.is_primary,
            "uploaded_at": self.uploaded_at.isoformat()
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


class Brand(db.Model):
    __tablename__ = "brand"

    id      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name    = db.Column(db.String(100), nullable=False, unique=True)
    country = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "country": self.country
        }


class Product(db.Model):
    __tablename__ = "product"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name        = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price       = db.Column(db.Numeric(10, 2), nullable=False)
    brand_id    = db.Column(db.Integer, db.ForeignKey("brand.id"), nullable=True)
    expire      = db.Column(db.Date, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=False)
    uom_id      = db.Column(db.Integer, db.ForeignKey("unit_of_measure.id"), nullable=True)
    
    # Discounts
    discount_percent    = db.Column(db.Numeric(5, 2), default=0)
    discount_expires_at = db.Column(db.Date, nullable=True)

    # Relationships
    category = db.relationship("Category", backref=db.backref("products", lazy=True))
    uom      = db.relationship("UnitOfMeasure", backref=db.backref("products", lazy=True))
    brand    = db.relationship("Brand", backref=db.backref("products", lazy=True))
    images   = db.relationship("ProductImage", backref="product", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        sale_price = float(self.price)
        has_discount = False
        
        if self.discount_percent and float(self.discount_percent) > 0:
            if not self.discount_expires_at or self.discount_expires_at >= datetime.utcnow().date():
                has_discount = True
                sale_price = float(self.price) * (1 - float(self.discount_percent) / 100)

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "brand_id": self.brand_id,
            "brand_name": self.brand.name if self.brand else None,
            "company": self.brand.name if self.brand else None,
            "expire": self.expire.isoformat() if self.expire else None,
            "category_id": self.category_id,
            "uom_id": self.uom_id,
            "uom_name": self.uom.name if self.uom else None,
            "uom_abbreviation": self.uom.abbreviation if self.uom else None,
            "discount_percent": float(self.discount_percent) if self.discount_percent else 0,
            "discount_expires_at": self.discount_expires_at.isoformat() if self.discount_expires_at else None,
            "sale_price": round(sale_price, 2),
            "has_discount": has_discount
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
            "url": self.url.replace(":5000/", ":5001/"),
            "is_primary": self.is_primary,
            "uploaded_at": self.uploaded_at.isoformat()
        }


class Discount(db.Model):
    __tablename__ = "discount"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code       = db.Column(db.String(50), unique=True, nullable=False)
    type       = db.Column(db.Enum('percent', 'fixed'), nullable=False)
    value      = db.Column(db.Numeric(10, 2), nullable=False)
    min_order  = db.Column(db.Numeric(10, 2), default=0)
    expires_at = db.Column(db.Date, nullable=True)
    is_active  = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "type": self.type,
            "value": float(self.value),
            "min_order": float(self.min_order) if self.min_order else 0,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active
        }


class Wishlist(db.Model):
    __tablename__ = "wishlist"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    product_id  = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    customer = db.relationship("Customer", backref=db.backref("wishlists", lazy=True))
    product  = db.relationship("Product", backref=db.backref("wishlisted_by", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "product_id": self.product_id,
            "created_at": self.created_at.isoformat(),
            "product": self.product.to_dict() if self.product else None
        }


class Cart(db.Model):
    __tablename__ = "cart"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    product_id  = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity    = db.Column(db.Integer, nullable=False, default=1)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = db.relationship("Customer", backref=db.backref("cart_items", lazy=True))
    product  = db.relationship("Product", backref=db.backref("in_carts", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "product": self.product.to_dict() if self.product else None
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

    # Relationships
    images = db.relationship("CustomerImage", backref="customer", cascade="all, delete-orphan", lazy=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash: return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        primary_image = next((img.url for img in self.images if img.is_primary), None)
        if not primary_image and self.images:
            primary_image = self.images[0].url

        if primary_image:
            primary_image = primary_image.replace(":5000/", ":5001/")

        return {
            "id": self.id,
            "name": self.name,
            "number": self.number,
            "email": self.email,
            "address": self.address,
            "description": self.description,
            "role": "customer",
            "image_url": primary_image
        }


class CustomerImage(db.Model):
    __tablename__ = "customer_image"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    url         = db.Column(db.String(255), nullable=False)
    is_primary  = db.Column(db.Boolean, nullable=False, default=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url.replace(":5000/", ":5001/"),
            "is_primary": self.is_primary,
            "uploaded_at": self.uploaded_at.isoformat()
        }


class Supplier(db.Model):
    __tablename__ = "supplier"

    id      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name    = db.Column(db.String(100), nullable=False)
    email   = db.Column(db.String(100), nullable=False, unique=True)
    address = db.Column(db.String(255), nullable=False)

    # Relationships
    numbers = db.relationship("SupplierNumber", backref="supplier", cascade="all, delete-orphan", lazy=True)
    images  = db.relationship("SupplierImage", backref="supplier", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        primary_image = next((img.url for img in self.images if img.is_primary), None)
        if not primary_image and self.images:
            primary_image = self.images[0].url

        if primary_image:
            primary_image = primary_image.replace(":5000/", ":5001/")

        purchases = Purchase.query.filter_by(supplier_id=self.id).order_by(Purchase.date.desc(), Purchase.id.desc()).all()
        purchase_ids = [purchase.id for purchase in purchases]
        total_purchase_amount = 0
        outstanding_amount = 0

        if purchase_ids:
            details = PurchaseDetail.query.filter(PurchaseDetail.purchase_id.in_(purchase_ids)).all()
            detail_totals = {}
            for detail in details:
                line_total = float(detail.price) * detail.quantity
                total_purchase_amount += line_total
                detail_totals[detail.purchase_id] = detail_totals.get(detail.purchase_id, 0) + line_total
            paid_rows = PaymentSupplier.query.filter(
                PaymentSupplier.purchase_id.in_(purchase_ids),
                PaymentSupplier.status == 1
            ).all()
            paid_totals = {}
            for payment in paid_rows:
                paid_totals[payment.purchase_id] = paid_totals.get(payment.purchase_id, 0) + float(payment.amount)
            outstanding_amount = sum(
                max(detail_totals.get(purchase.id, 0) - paid_totals.get(purchase.id, 0), 0)
                for purchase in purchases
                if purchase.status != "cancelled"
            )

        active_links = [link for link in self.product_links if link.is_active]
        source_products = [
            {
                "id": link.product_id,
                "name": link.product.name if link.product else f"Product #{link.product_id}",
                "unit_price": float(link.unit_price)
            }
            for link in active_links[:8]
        ]
        recent_purchases = [
            {
                "id": purchase.id,
                "date": purchase.date.isoformat(),
                "status": purchase.status,
                "total_amount": round(sum(float(detail.price) * detail.quantity for detail in purchase.details), 2)
            }
            for purchase in purchases[:5]
        ]

        return {
            "id": self.id,
            "name": self.name,
            "numbers": [n.number for n in self.numbers],
            "email": self.email,
            "address": self.address,
            "image_url": primary_image,
            "images": [img.to_dict() for img in self.images],
            "source_count": len(active_links),
            "purchase_count": len(purchases),
            "pending_purchase_count": sum(1 for purchase in purchases if purchase.status == "pending"),
            "total_purchase_amount": round(total_purchase_amount, 2),
            "outstanding_amount": round(outstanding_amount, 2),
            "source_products": source_products,
            "recent_purchases": recent_purchases
        }


class SupplierNumber(db.Model):
    __tablename__ = "supplier_number"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    number      = db.Column(db.String(45), nullable=False, unique=True)

    def to_dict(self):
        return {
            "id": self.id,
            "number": self.number
        }


class SupplierImage(db.Model):
    __tablename__ = "supplier_image"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    url         = db.Column(db.String(255), nullable=False)
    is_primary  = db.Column(db.Boolean, nullable=False, default=False)
    uploaded_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url.replace(":5000/", ":5001/"),
            "is_primary": self.is_primary,
            "uploaded_at": self.uploaded_at.isoformat()
        }


class SupplierProduct(db.Model):
    __tablename__ = "supplier_product"
    __table_args__ = (
        db.UniqueConstraint("supplier_id", "product_id", name="uq_supplier_product"),
    )

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    product_id  = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    unit_price  = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    is_active   = db.Column(db.Boolean, default=True)

    supplier = db.relationship("Supplier", backref=db.backref("product_links", lazy=True, cascade="all, delete-orphan"))
    product  = db.relationship("Product", backref=db.backref("supplier_links", lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        product = self.product
        supplier = self.supplier
        stock = db.session.query(db.func.sum(Inventory.inventory_quantity))\
            .filter(Inventory.product_id == self.product_id).scalar() or 0
        return {
            "id": self.id,
            "supplier_id": self.supplier_id,
            "supplier_name": supplier.name if supplier else None,
            "product_id": self.product_id,
            "product_name": product.name if product else None,
            "unit_price": float(self.unit_price),
            "is_active": self.is_active,
            "price": float(product.price) if product else None,
            "brand_id": product.brand_id if product else None,
            "brand_name": product.brand.name if product and product.brand else None,
            "category_id": product.category_id if product else None,
            "category_name": product.category.name if product and product.category else None,
            "uom_id": product.uom_id if product else None,
            "uom_name": product.uom.name if product and product.uom else None,
            "uom_abbreviation": product.uom.abbreviation if product and product.uom else None,
            "stock": int(stock),
        }


class Orders(db.Model):
    __tablename__ = "orders"

    id          = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date        = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employee.id"), nullable=True)
    
    # Discounts
    discount_id     = db.Column(db.Integer, db.ForeignKey("discount.id"), nullable=True)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)

    customer = db.relationship("Customer", backref=db.backref("orders", lazy=True))
    employee = db.relationship("Employee", backref=db.backref("processed_orders", lazy=True))
    discount = db.relationship("Discount", backref=db.backref("orders", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat(),
            "customer_id": self.customer_id,
            "employee_id": self.employee_id,
            "discount_id": self.discount_id,
            "discount_amount": float(self.discount_amount) if self.discount_amount else 0
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
