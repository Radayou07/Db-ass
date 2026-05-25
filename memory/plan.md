# Project Handoff — Inventory Control Management System

## Project Overview
A full-stack inventory management web app.
- **Frontend**: React + Vite + Tailwind CSS v4 (custom theme)
- **Backend**: Python Flask + SQLAlchemy + MySQL
- **Repo**: https://github.com/Radayou07/Db-ass.git

---

## Database
Fixed MySQL schema is in `schema_fixed.sql`. Key tables:
- `employee` (staff/admin login), `employee_image`
- `customer`, `customer_image`
- `category`, `product`, `product_image`
- `supplier`
- `warehouse`, `inventory` (stock per warehouse — source of truth, NO product_quantity on product)
- `orders` (was `order` — renamed, reserved keyword), `order_detail`
- `purchase`, `purchase_detail`
- `payment_customer`, `payment_supplier`

---

## Color Theme (Tailwind CSS v4 custom vars in `frontend/src/index.css`)
```
--color-side-text:        #cbd5e1   (sidebar text)
--color-side-icon:        #38bdf8   (sky blue accent)
--color-slider-bg:        #0d2137   (sidebar background)
--color-slider-dark-bg:   #060e1a
--color-main-bg:          #eef5fb   (page background)
--color-main-dark-bg:     #07111e
--color-box-bg:           #ffffff
--color-box-dark-bg:      #0e1f35
```

---

## What Has Been Built (Pair 1 — Auth)

### Backend file structure:
```
backend/
  App.py           ← Flask app factory, registers blueprints
  config.py        ← reads .env for DB + JWT config
  extensions.py    ← shared db = SQLAlchemy(), jwt = JWTManager()
  models.py        ← Employee model
  routes/
    __init__.py
    auth.py        ← login, register, /me endpoints
  requirements.txt
  .env.example
```

### Backend endpoints (all under /api):
- `POST /api/auth/login`    — { email, password } → { token, user }
- `POST /api/auth/register` — { name, number, email, password, role? } → { message, user }
- `GET  /api/auth/me`       — Bearer token required → { id, name, email, role }

JWT token expires in 8 hours. Token payload includes: sub (employee id), role, name, email.

### Employee model fields:
id, name, number (unique), email (unique), password_hash, role ENUM('admin','staff')

### Frontend file structure (what was added/changed):
```
frontend/src/
  App.jsx                         ← UPDATED: AuthProvider wrap, public/protected routes
  context/
    AuthContext.jsx               ← NEW: login, logout, register, isAdmin, authFetch
  components/
    ProtectedRoute.jsx            ← NEW: redirects to /login if not authenticated
    SideBar.jsx                   ← UPDATED: user avatar, name, role badge, logout button
  pages/
    Login.jsx                     ← NEW: split panel login page
    Register.jsx                  ← NEW: staff registration page
```

### How auth works:
1. User visits any page → ProtectedRoute checks localStorage for token
2. No token → redirect to /login
3. Login → POST /api/auth/login → store token in localStorage → redirect to /
4. Token decoded in AuthContext to get { id, name, email, role }
5. `useAuth()` hook used everywhere: `const { user, isAdmin, authFetch, logout } = useAuth()`
6. `authFetch(url, options)` is a wrapper around fetch() that auto-adds Authorization header

---

## What Still Needs to Be Built

### Pair 2 — Products + Categories
**Backend:**
- `routes/product.py` — full CRUD for products and categories
  - `GET    /api/products`           — list with search/filter by category, name
  - `POST   /api/products`           — create (admin only)
  - `GET    /api/products/:id`        — single product
  - `PUT    /api/products/:id`        — edit (admin only)
  - `DELETE /api/products/:id`        — delete (admin only)
  - `GET    /api/categories`          — list categories
  - `POST   /api/categories`          — create category
- Product model fields: id, name, description, price, company, expire, category_id
- Register blueprint in App.py: `app.register_blueprint(product_bp, url_prefix="/api/products")`

**Frontend:**
- `pages/Product.jsx` — REPLACE the existing broken one
  - Table view with: name, category, price, company, expiry, stock (computed from inventory)
  - Search bar + filter by category
  - Add / Edit modal (full form)
  - Delete with confirmation modal (not browser confirm())
  - Admin-only: show Add/Edit/Delete buttons (check `isAdmin` from useAuth)

### Pair 3 — Inventory + Warehouse
**Backend:**
- `routes/inventory.py`
  - CRUD for warehouses: GET/POST /api/warehouses, PUT/DELETE /api/warehouses/:id
  - CRUD for inventory: GET /api/inventory (with product + warehouse info joined)
  - GET /api/inventory/product/:id — stock per warehouse for one product
  - PUT /api/inventory/:id — update quantity
- Inventory model: id, inventory_quantity, last_update (TIMESTAMP auto), product_id, warehouse_id
- Warehouse model: id, name, location, capacity

**Frontend:**
- New page `pages/Inventory.jsx` — already added to SideBar as `/inventory`
  - Table showing: product name, warehouse name, quantity, last_update
  - Filter by warehouse
  - Edit quantity inline or via modal

### Pair 4 — Customers + Orders
**Backend:**
- `routes/customer.py`
  - CRUD /api/customers
  - GET /api/customers/:id/orders — full order history with order_detail + payment_customer joined
- `routes/order.py`
  - GET/POST /api/orders
  - GET /api/orders/:id — order with items + payment info
- Order history should include: product name, price at time of sale, quantity, payment method, total, date, status

**Frontend:**
- `pages/Customer.jsx` — REPLACE existing
  - Customer list with search
  - Click customer → see purchase history panel/modal
  - History shows: date, products bought, price at time, payment method, total

### Pair 5 — Suppliers + Purchases
**Backend:**
- `routes/supplier.py`
  - CRUD /api/suppliers
  - GET /api/suppliers/:id/purchases — purchase history with purchase_detail + payment_supplier
- `routes/purchase.py`
  - GET/POST /api/purchases

**Frontend:**
- `pages/Supplier.jsx` — REPLACE existing
  - Supplier list with search
  - Click supplier → see purchase history

### Pair 6 — Home Dashboard
**Backend:**
- `GET /api/dashboard/stats` — returns:
  - total_sales (sum of payment_customer.amount where status=1)
  - total_purchases (sum of payment_supplier.amount where status=1)
  - low_stock_products (inventory_quantity < 10)
  - recent_orders (last 5)
  - recent_purchases (last 5)

**Frontend:**
- `pages/Home.jsx` — REPLACE existing
  - Stat cards: Total Sales, Total Purchases, Low Stock count, Total Products
  - Recent orders table
  - Recent purchases table

---

## Important Notes for the AI Continuing This

1. **Always use `authFetch` from `useAuth()`** for all API calls — it auto-adds the JWT header
2. **Admin-only actions**: wrap with `isAdmin` check from `useAuth()`. Staff can view + process, admin can delete + manage employees
3. **Stock quantity**: NEVER use product.product_quantity — it was removed. Always compute from `inventory` table (SUM of inventory_quantity grouped by product_id)
4. **`orders` table** — note the table is named `orders` not `order` (MySQL reserved word)
5. **Backend blueprint pattern**: each pair adds a new `routes/xxx.py` file and registers it in App.py
6. **To protect a backend route**: use `@jwt_required()` decorator from flask_jwt_extended. Get role from `get_jwt()["role"]`
7. **Frontend route `/inventory`** is already in the SideBar nav — just needs the page built
8. **Existing pages to REPLACE**: Product.jsx (broken handlers), Customer.jsx, Supplier.jsx, Order.jsx, Home.jsx
9. **Pages to leave alone**: Analysis.jsx, About.jsx

## Running the Project
```bash
# Backend
cd backend
cp .env.example .env   # fill in MySQL credentials
pip install -r requirements.txt
python App.py          # runs on http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev            # runs on http://localhost:5173
```