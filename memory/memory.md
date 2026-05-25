# SYSTEM PROMPT / CONTEXT: Inventory Control Management System

You are an expert full-stack developer assisting with the continuation of an inventory control web application. Here is the exact current state of the project, including database architecture, completed modules, and upcoming objectives. Use this context to answer all subsequent prompts.

## ── PROJECT OVERVIEW ──
* **Frontend:** React + Vite + Tailwind CSS v4 (Custom Light/Dark mode configurations)
* [cite_start]**Backend:** Python Flask + SQLAlchemy + MySQL [cite: 1]
* **Repo:** https://github.com/Radayou07/Db-ass.git

### Tailwind CSS v4 Theme Variables (frontend/src/index.css)
* `--color-side-text`:        #cbd5e1 (sidebar text)
* `--color-side-icon`:        #38bdf8 (sky blue accent)
* `--color-slider-bg`:        #0d2137 (sidebar background)
* `--color-slider-dark-bg`:   #060e1a
* `--color-main-bg`:          #eef5fb (page background)
* `--color-main-dark-bg`:     #07111e
* `--color-box-bg`:           #ffffff
* `--color-box-dark-bg`:      #0e1f35

## ── CORE ARCHITECTURAL CONSTRAINTS ──
1.  **NO `product_quantity` Column:** Stock must NEVER be read or stored as a raw field on the product table. True current stock is a derived property computed dynamically via backend aggregation over the `inventory` table: `SUM(inventory_quantity) GROUP BY product_id`.
2.  **Reserved Keyword Fix:** The SQL table for orders is named `orders` (plural) to prevent syntax collisions with the MySQL reserved keyword `ORDER`.
3.  **Authentication Rules:** All protected network calls use the frontend wrapper `authFetch(url, options)`, which auto-injects the JWT Bearer token. Admin-only operations (`POST`, `PUT`, `DELETE`) are strictly gated on the backend by checking `get_jwt()["role"] == 'admin'` and conditionally rendered on the frontend using the `isAdmin` boolean from `useAuth()`.

---

## ── WHAT HAS BEEN BUILT ──

### 🔐 PAIR 1: Auth Module (Completed)
* [cite_start]**Backend Stack:** `App.py` (App factory) [cite: 1][cite_start], `config.py` (reads `.env` for DB credentials/JWT setup) [cite: 1][cite_start], `extensions.py` (instantiates shared `db` and `jwt`) [cite: 1][cite_start], `models.py` (`Employee` schema) [cite: 1][cite_start], and `routes/auth.py` (`/login`, `/register`, `/me` endpoints)[cite: 1].
* [cite_start]**JWT Claims:** Tokens expire in 8 hours and carry embedded identity claims (`role`, `name`, `email`)[cite: 1].
* **Frontend Stack:** `AuthContext.jsx` provides the state hook `useAuth()`. React Router handles public routes (`/login`, `/register`) and passes protected routes through an `<AppLayout>` layout containing a sidebar navigation component and an `<Outlet />` element.

### 📦 PAIR 2: Products & Categories (Just Completed)
* **Backend Extensions (`models.py` updated):**
    * `Category` model (id, name unique)
    * `Product` model (id, name, description text, numeric price, company brand string, date expire, category_id foreign key)
    * `Inventory` model (id, inventory_quantity, timestamp last_update, product_id foreign key, warehouse_id)
* **Backend Endpoints (`routes/product.py` registered in `App.py`):**
    * `GET /api/products` — Returns all products joined with their category names, computing total stock on the fly via an outer join against an aggregate subquery.
    * `POST /api/products` — Creates a product (Gated: Admin only).
    * `GET /api/products/:id` — Fetches a single item and yields its specific stock totals.
    * `PUT /api/products/:id` — Mutates master product fields (Gated: Admin only).
    * `DELETE /api/products/:id` — Standard deletion that safely flushes related inventory tracking branches before executing drop cascades (Gated: Admin only).
    * `GET /api/categories` — Fetches complete system category listings.
    * `POST /api/categories` — Appends a new unique identifier to the master list.
* **Frontend Component (`pages/Product.jsx` fully wired):**
    * Implements list and grid system views using local state filters (`searchQuery` and `selectedCategory`).
    * Features an internal reactive form modal for unified creation/editing, and a separate structural drop confirmation modal to replace primitive browser alert behaviors.
    * Hides mutation interaction points dynamically from standard Staff member authorization levels.

---

## ── NEXT STEPS (WHAT STILL NEEDS TO BE BUILT) ──

### 🛠️ Pair 3 — Inventory + Warehouse Tracking
* **Backend:** Create `routes/inventory.py`. Add full CRUD for warehouses (`/api/warehouses`) and inventory rows (`/api/inventory`). Join warehouse locations and product entities together. Build an endpoint to isolate exact stock levels across unique sites (`GET /api/inventory/product/:id`).
* **Frontend (`pages/Inventory.jsx`):** Build out a clean data grid layout tracking `[Product Name | Warehouse Name | Quantity | Last Updated]`. Implement filter dropdowns to isolate records by warehouse, and create fields for inline stock adjustments.

### 👥 Pair 4 — Customers + Sales Order Tracking
* **Backend:** Create `routes/customer.py` (CRUD `/api/customers`) and `routes/order.py` (`GET/POST /api/orders`). Create a relational map path tracing a customer's specific purchase records deep through historical data layers: `orders` ➔ `order_detail` ➔ `product` ➔ `payment_customer`.
* **Frontend (`pages/Customer.jsx`):** Build a target search directory for clients. Clicking a customer card should expose an invoice panel/modal laying out historical order timelines, sale-point pricing, payment configurations, and itemized descriptions.

### 🤝 Pair 5 — Suppliers + Procurement Purchases
* **Backend:** Create `routes/supplier.py` and `routes/purchase.py`. Handle resource paths for vendor lists (`/api/suppliers`) and wholesale procurement batches (`/api/purchases`).
* **Frontend (`pages/Supplier.jsx`):** Implement interactive directory lookup elements connected to background panel metrics showing supply chains and historical replenishment transactions.

### 📊 Pair 6 — Home Dashboard Core Analytics
* **Backend:** Establish a centralized calculation endpoint (`GET /api/dashboard/stats`) summing historical revenues (`payment_customer` total when status code reflects finalized actions), ongoing wholesale acquisitions (`payment_supplier`), low stock indicators (aggregate values sliding under 10 items), and slicing transaction feeds down to the 5 most recent actions.
* **Frontend (`pages/Home.jsx`):** Craft executive layout visual grids highlighting critical key metrics using summary layout blocks, balanced alongside side-by-side transaction log streams.