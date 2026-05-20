import { useState, useMemo } from "react"
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
  FiPackage, FiAlertTriangle, FiLayers, FiGrid,
  FiChevronUp, FiChevronDown, FiCalendar,
} from "react-icons/fi"

/* ─── Mock data ─── */
const CATEGORIES = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Accessories" },
  { id: 3, name: "Storage"     },
  { id: 4, name: "Peripherals" },
  { id: 5, name: "Audio"       },
]

let nextPid = 9
const SEED_PRODUCTS = [
  { id:1, name:"USB-C Hub Pro",       price:49.99,  product_quantity:145, company:"Anker",       expire:null,         category_id:2 },
  { id:2, name:"Mechanical Keyboard", price:129.99, product_quantity:62,  company:"Keychron",    expire:null,         category_id:4 },
  { id:3, name:'27" Monitor',         price:349.99, product_quantity:28,  company:"LG",          expire:null,         category_id:1 },
  { id:4, name:"Webcam 4K",           price:89.99,  product_quantity:54,  company:"Logitech",    expire:null,         category_id:1 },
  { id:5, name:"Laptop Stand",        price:39.99,  product_quantity:203, company:"Rain Design", expire:null,         category_id:2 },
  { id:6, name:"Portable SSD 1TB",    price:99.99,  product_quantity:0,   company:"Samsung",     expire:null,         category_id:3 },
  { id:7, name:"Headset Pro",         price:159.99, product_quantity:35,  company:"Sony",        expire:null,         category_id:5 },
  { id:8, name:"SD Card 256GB",       price:29.99,  product_quantity:8,   company:"SanDisk",     expire:"2027-12-31", category_id:3 },
]

const EMPTY = { name:"", price:"", product_quantity:"", company:"", expire:"", category_id:"" }

/* ─── Helpers ─── */
function expiryStatus(d) {
  if (!d) return null
  const diff = (new Date(d) - new Date()) / 86400000
  if (diff < 0)  return "expired"
  if (diff < 30) return "soon"
  return "ok"
}

/* ─── Shared primitives ─── */
function Card({ children, className="" }) {
  return (
    <div className={`bg-box-bg dark:bg-box-dark-bg rounded-xl shadow-sm border border-black/[.04] dark:border-white/[.06] ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ icon:Icon, label, value, iconClass, cardClass }) {
  return (
    <Card className={`flex items-center gap-4 p-4 border-2 ${cardClass}`}>
      <span className={`p-2.5 rounded-xl ${iconClass}`}><Icon size={18}/></span>
      <div>
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
      </div>
    </Card>
  )
}

function SortTh({ label, field, sort, onSort, className="" }) {
  const active = sort.field === field
  return (
    <th onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider
                  cursor-pointer select-none whitespace-nowrap hover:text-slate-600 dark:hover:text-slate-200
                  transition-colors ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="flex flex-col">
          <FiChevronUp   size={10} className={active && sort.dir==="asc"  ? "text-sky-400" : "opacity-30"} />
          <FiChevronDown size={10} className={active && sort.dir==="desc" ? "text-sky-400" : "opacity-30"} />
        </span>
      </span>
    </th>
  )
}

function ConfirmDelete({ name, entity="Product", onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-sm bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl
                      border border-black/[.06] dark:border-white/[.08] p-6 flex flex-col items-center gap-4 text-center">
        <span className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
          <FiAlertTriangle size={22} className="text-red-500"/>
        </span>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Delete {entity}</h3>
          <p className="text-sm text-slate-400 mt-1">
            Are you sure you want to delete{" "}
            <span className="font-medium text-slate-600 dark:text-slate-300">{name}</span>?
            {" "}This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10
                       text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Product modal ─── */
function ProductModal({ initial, categories, onSave, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(
    initial
      ? { ...initial, price: String(initial.price), product_quantity: String(initial.product_quantity),
          expire: initial.expire ?? "", category_id: String(initial.category_id) }
      : EMPTY
  )
  const [errors, setErrors] = useState({})

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.name.trim())                               e.name              = "Required"
    if (!form.price || isNaN(+form.price) || +form.price < 0) e.price       = "Valid price required"
    if (form.product_quantity === "" || isNaN(+form.product_quantity))       e.product_quantity = "Required"
    if (!form.company.trim())                            e.company           = "Required"
    if (!form.category_id)                               e.category_id       = "Select a category"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSave({
      ...form,
      price:            parseFloat(form.price),
      product_quantity: parseInt(form.product_quantity),
      category_id:      parseInt(form.category_id),
      expire:           form.expire || null,
    })
  }

  const wrap = f => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
    errors[f]
      ? "border-red-400 bg-red-50 dark:bg-red-950/20"
      : "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus-within:border-sky-400"
  }`
  const inp = "flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-lg bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[.05] dark:border-white/[.06]">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              {isEdit ? "Edit Product" : "New Product"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? "Update product details" : "Fill in product information"}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <FiX size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {/* Name — full width */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Product Name</label>
            <div className={wrap("name")}>
              <input value={form.name} onChange={set("name")} placeholder="e.g. USB-C Hub Pro" className={inp}/>
            </div>
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Price ($)</label>
            <div className={wrap("price")}>
              <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} placeholder="0.00" className={inp}/>
            </div>
            {errors.price && <p className="text-[11px] text-red-400 mt-1">{errors.price}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Quantity</label>
            <div className={wrap("product_quantity")}>
              <input type="number" min="0" value={form.product_quantity} onChange={set("product_quantity")} placeholder="0" className={inp}/>
            </div>
            {errors.product_quantity && <p className="text-[11px] text-red-400 mt-1">{errors.product_quantity}</p>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Company</label>
            <div className={wrap("company")}>
              <input value={form.company} onChange={set("company")} placeholder="e.g. Anker" className={inp}/>
            </div>
            {errors.company && <p className="text-[11px] text-red-400 mt-1">{errors.company}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Category</label>
            <div className={wrap("category_id")}>
              <select value={form.category_id} onChange={set("category_id")} className={`${inp} cursor-pointer`}>
                <option value="">Select…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {errors.category_id && <p className="text-[11px] text-red-400 mt-1">{errors.category_id}</p>}
          </div>

          {/* Expiry — full width, optional */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Expiry Date <span className="text-slate-300 dark:text-slate-600 font-normal">(optional)</span>
            </label>
            <div className={wrap("expire")}>
              <FiCalendar size={14} className="text-slate-400 shrink-0"/>
              <input type="date" value={form.expire} onChange={set("expire")} className={inp}/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 pb-5 pt-1">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm">
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function Product() {
  const [products,   setProducts]   = useState(SEED_PRODUCTS)
  const [categories]                = useState(CATEGORIES)
  const [search,     setSearch]     = useState("")
  const [filterCat,  setFilterCat]  = useState("")
  const [sort,       setSort]       = useState({ field:"name", dir:"asc" })
  const [modal,      setModal]      = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)

  const catMap = useMemo(() =>
    Object.fromEntries(categories.map(c => [c.id, c.name])), [categories])

  const outOfStock = products.filter(p => p.product_quantity === 0).length
  const lowStock   = products.filter(p => p.product_quantity > 0 && p.product_quantity < 10).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products
      .filter(p =>
        (p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q)) &&
        (!filterCat || p.category_id === parseInt(filterCat))
      )
      .sort((a, b) => {
        const va = a[sort.field], vb = b[sort.field]
        if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === "asc" ? va - vb : vb - va
      })
  }, [products, search, filterCat, sort])

  function handleSort(f) {
    setSort(s => s.field === f ? { field:f, dir: s.dir==="asc" ? "desc" : "asc" } : { field:f, dir:"asc" })
  }

  function handleSave(form) {
    if (modal.mode === "add") setProducts(ps => [...ps, { ...form, id: nextPid++ }])
    else setProducts(ps => ps.map(p => p.id === modal.data.id ? { ...p, ...form } : p))
    setModal(null)
  }

  function handleDelete() {
    setProducts(ps => ps.filter(p => p.id !== delTarget.id))
    setDelTarget(null)
  }

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-200">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Products</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your product catalog</p>
        </div>
        <button onClick={() => setModal({ mode:"add" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600
                     text-white text-sm font-medium transition-colors shadow-sm shadow-sky-200 dark:shadow-none">
          <FiPlus size={16}/> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard icon={FiPackage}       label="Total Products" value={products.length}
          iconClass="text-sky-400 bg-sky-50 dark:bg-sky-950/40"   cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiLayers}        label="Total Stock"    value={products.reduce((s,p) => s+p.product_quantity, 0).toLocaleString()}
          iconClass="text-teal-400 bg-teal-50 dark:bg-teal-950/40" cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiGrid}          label="Categories"     value={categories.length}
          iconClass="text-violet-400 bg-violet-50 dark:bg-violet-950/40" cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiAlertTriangle} label="Out of Stock"   value={outOfStock}
          iconClass="text-orange-400 bg-orange-50 dark:bg-orange-950/40" cardClass="border-box-border-warn bg-box-border-warn-bg"/>
      </div>

      {/* Search + category filter */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/10
                        dark:border-white/10 bg-box-bg dark:bg-box-dark-bg shadow-sm">
          <FiSearch size={16} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or company…"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200
                       placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"/>
          {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition-colors"><FiX size={15}/></button>}
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10
                     bg-box-bg dark:bg-box-dark-bg text-sm text-slate-600 dark:text-slate-300 outline-none cursor-pointer">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/60 backdrop-blur-sm">
              <tr className="border-b border-black/[.06] dark:border-white/[.06]">
                <SortTh label="Product"  field="name"             sort={sort} onSort={handleSort} className="pl-5"/>
                <SortTh label="Category" field="category_id"      sort={sort} onSort={handleSort}/>
                <SortTh label="Company"  field="company"          sort={sort} onSort={handleSort}/>
                <SortTh label="Price"    field="price"            sort={sort} onSort={handleSort}/>
                <SortTh label="Stock"    field="product_quantity" sort={sort} onSort={handleSort}/>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 pr-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.04] dark:divide-white/[.04]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">No products found.</td></tr>
              ) : filtered.map(p => {
                const qty = p.product_quantity
                const expStatus = expiryStatus(p.expire)
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[.03] transition-colors group">
                    <td className="px-4 py-3 pl-5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/50 flex items-center justify-center shrink-0">
                          <FiPackage size={13} className="text-sky-500"/>
                        </span>
                        <span className="text-sm font-medium whitespace-nowrap">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                        {catMap[p.category_id] ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.company}</td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        qty === 0 ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400" :
                        qty < 10  ? "bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400" :
                                    "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {qty === 0 ? "Out of stock" : qty < 10 ? `Low · ${qty}` : qty.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py