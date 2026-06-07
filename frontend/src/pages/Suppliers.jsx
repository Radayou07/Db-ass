import { useState, useEffect, useMemo, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
  FiTruck, FiUsers, FiMail, FiPhone, FiMapPin,
  FiChevronUp, FiChevronDown, FiAlertTriangle, FiActivity, FiCalendar, FiDollarSign, FiShoppingBag, FiLayers, FiCheck, FiPlusCircle, FiMinusCircle, FiTag, FiBox, FiCamera, FiLoader, FiUploadCloud,
  FiEye, FiCreditCard, FiRefreshCw
} from "react-icons/fi"

/* ─── Helpers ─── */
const AVATAR_COLORS = [
  "bg-sky-500","bg-violet-500","bg-teal-500",
  "bg-orange-400","bg-rose-500","bg-emerald-500","bg-amber-500",
]
const avatarColor = id => AVATAR_COLORS[id % AVATAR_COLORS.length]
const initials    = name => name.trim().split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()

const EMPTY = { name:"", numbers:[""], email:"", address:"", images: [] }

/* ─── Shared primitives ─── */
function Card({ children, className="" }) {
  return (
    <div className={`bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-sm border border-box-border dark:border-box-dark-border ${className}`}>
      {children}
    </div>
  )
}

function StatCard({ icon:Icon, label, value, iconClass, cardClass }) {
  return (
    <Card className={`flex items-center gap-4 p-5 border-2 ${cardClass}`}>
      <span className={`p-3 rounded-2xl ${iconClass}`}><Icon size={20}/></span>
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">{value}</p>
      </div>
    </Card>
  )
}

function SortTh({ label, field, sort, onSort, className="" }) {
  const active = sort.field === field
  return (
    <th onClick={() => onSort(field)}
      className={`px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]
                  cursor-pointer select-none whitespace-nowrap hover:text-slate-600 dark:hover:text-slate-200
                  transition-colors ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span className="flex flex-col opacity-60">
          <FiChevronUp   size={10} className={active && sort.dir==="asc"  ? "text-sky-500 opacity-100" : ""} />
          <FiChevronDown size={10} className={active && sort.dir==="desc" ? "text-sky-500 opacity-100" : ""} />
        </span>
      </span>
    </th>
  )
}

function ConfirmDelete({ name, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-sm bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] shadow-2xl
                      border border-box-border dark:border-box-dark-border p-8 flex flex-col items-center gap-4 text-center">
        <span className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center border border-rose-100 dark:border-rose-900/30 mb-2 shadow-xl shadow-rose-100 dark:shadow-none">
          <FiAlertTriangle size={36} />
        </span>
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Remove Supplier</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed px-2">
            Are you sure you want to remove <span className="font-black text-slate-800 dark:text-slate-200">"{name}"</span>? This will hide them from your list.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-4">
          <button onClick={onClose} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-200 dark:shadow-none transition-all active:scale-95">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Purchase Order Modal (Create Order) ─── */
function PurchaseOrderModal({ supplier, onClose, onSave }) {
  const { authFetch } = useAuth()
  const { toast } = useToast()
  const [catalog, setCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [items, setItems] = useState([{ product_id: "", quantity: 1, price: 0 }])
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchCatalog() {
      setCatalogLoading(true)
      try {
        const res = await authFetch(`/suppliers/${supplier.id}/products`)
        if (res.ok) setCatalog(await res.json())
      } catch (err) {
        console.error("Supplier product catalog fetch failed", err)
      } finally {
        setCatalogLoading(false)
      }
    }
    fetchCatalog()
  }, [supplier.id])

  const addItem = () => setItems([...items, { product_id: "", quantity: 1, price: 0 }])
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))
  
  const updateItem = (idx, field, val) => {
    const newItems = [...items]
    newItems[idx][field] = val
    if (field === 'product_id') {
      const p = catalog.find(p => String(p.product_id) === String(val))
      if (p) newItems[idx].price = Number(p.unit_price) || 0
    }
    setItems(newItems)
  }

  const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.some(i => !i.product_id || i.quantity <= 0)) return toast("Purchase order list contains invalid quantities", "error")
    setLoading(true)
    await onSave({ supplier_id: supplier.id, note, items })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] shadow-2xl border border-box-border dark:border-box-dark-border flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-8 pt-7 pb-6 border-b border-slate-100 dark:border-slate-800">
           <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                 <FiShoppingBag className="text-sky-500" size={28}/> Purchase Order
              </h2>
              <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.3em]">Supplier: {supplier.name}</p>
           </div>
           <button onClick={onClose} className="p-3 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
           <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vendor Catalog: Products We Buy From Them</label>
                      <button type="button" onClick={addItem} className="flex items-center gap-2 text-[10px] font-black text-sky-500 hover:text-sky-600 uppercase tracking-widest transition-all">
                         <FiPlusCircle size={14}/> Add Item
                      </button>
                   </div>
                   <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center bg-slate-50 dark:bg-slate-900/40 p-4 rounded-3xl border border-black/5 dark:border-white/5 animate-fade-in group">
                           <div className="flex-1">
                              <select 
                                required 
                                value={item.product_id} 
                                onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-sm font-bold shadow-sm appearance-none cursor-pointer"
                              >
                                <option value="">Select a Product...</option>
                                {catalogLoading ? (
                                  <option value="">Loading products...</option>
                                ) : catalog.length === 0 ? (
                                  <option value="">No vendor catalog products yet</option>
                                ) : (
                                  catalog.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)
                                )}
                              </select>
                           </div>
                           <div className="w-24">
                              <input 
                                type="number" 
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-sm font-black text-center shadow-sm"
                              />
                           </div>
                           <div className="w-32">
                              <div className="relative">
                                 <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={14}/>
                                 <input 
                                   type="number" 
                                   step="0.01"
                                   placeholder="Cost"
                                   value={item.price}
                                   onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                   className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-sm font-black shadow-sm"
                                 />
                              </div>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => removeItem(idx)}
                             disabled={items.length === 1}
                             className="p-3 rounded-2xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all disabled:opacity-0 active:scale-90"
                           >
                              <FiTrash2 size={18}/>
                           </button>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 px-1">Order Notes</label>
                   <textarea 
                     rows="3" 
                     value={note}
                     onChange={e => setNote(e.target.value)}
                     placeholder="Shipping info, discounts, or notes..."
                     className="w-full px-6 py-4 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-sky-500 outline-none text-sm font-medium shadow-inner resize-none leading-relaxed"
                   />
                </div>
           </div>

           <div className="px-8 py-7 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent/20 flex items-center justify-between">
                <div className="px-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Cost</p>
                   <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${total.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                </div>
                <div className="flex gap-4">
                   <button type="button" onClick={onClose} className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Cancel</button>
                   <button type="submit" disabled={loading} className="px-12 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-sky-200 dark:shadow-none transition-all flex items-center gap-3 active:scale-95">
                      {loading ? "Saving..." : <><FiCheck size={18}/> Create Order</>}
                   </button>
                </div>
           </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Receipt (Arrival) Modal ─── */
function ReceiptModal({ purchase, warehouses, onClose, onConfirm }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onConfirm(purchase.id, warehouseId)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
       <div className="bg-box-bg dark:bg-box-dark-bg w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-box-border dark:border-box-dark-border">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 dark:shadow-none border border-emerald-100 dark:border-emerald-900/30">
             <FiLayers size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-2">Receive Items</h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8">Select which warehouse should receive the items from order <span className="font-black text-slate-700 dark:text-slate-300">#{purchase.id}</span>.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 px-1">Warehouse</label>
                <select 
                  required 
                  value={warehouseId} 
                  onChange={e => setWarehouseId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-emerald-400 outline-none text-sm font-black shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.location})</option>)}
                </select>
             </div>
             <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] shadow-xl shadow-emerald-200 dark:shadow-none uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95">
                   {loading ? "Receiving..." : <><FiCheck size={18}/> Add to Stock</>}
                </button>
             </div>
          </form>
       </div>
    </div>
  )
}

/* ─── Add Product From Supplier Modal ─── */
function SupplierProductCreateModal({ supplier, initialProduct, brands, categories, units, warehouses, onClose, onCreated }) {
  const { authFetch } = useAuth()
  const { toast } = useToast()
  const isModify = Boolean(initialProduct?.product_id)
  const initialCost = initialProduct?.unit_price || ""
  const [form, setForm] = useState({
    name: initialProduct?.product_name || "",
    description: initialProduct?.description || "",
    brand_id: initialProduct?.brand_id || brands[0]?.id || "",
    category_id: initialProduct?.category_id || categories[0]?.id || "",
    uom_id: initialProduct?.uom_id || units[0]?.id || "",
    buy_cost: initialCost,
    price: initialProduct?.price ?? (initialCost ? (Number(initialCost) * 1.3).toFixed(2) : ""),
    initial_quantity: isModify ? (initialProduct?.stock || 0) : 0,
    warehouse_id: initialProduct?.warehouse_id || warehouses[0]?.id || "",
    expire: initialProduct?.expire || "",
    images: initialProduct?.images?.map?.(img => img.url || img) || [],
    markup_percent: "",
    profit_amount: "",
  })
  const [saving, setSaving] = useState(false)
  const [uploadingProductImages, setUploadingProductImages] = useState(false)
  const [categoryOptions, setCategoryOptions] = useState(categories)
  const [quickCategoryName, setQuickCategoryName] = useState("")
  const [quickCategoryError, setQuickCategoryError] = useState("")
  const [isQuickAddingCategory, setIsQuickAddingCategory] = useState(false)

  const set = field => event => setForm(prev => ({ ...prev, [field]: event.target.value }))

  const updateBuyCost = (value) => {
    const cost = Number(value) || 0
    setForm(prev => ({ ...prev, buy_cost: value, price: cost > 0 ? (cost * 1.3).toFixed(2) : prev.price }))
  }

  const applyMarkup = (markup) => {
    const cost = Number(form.buy_cost) || 0
    if (cost > 0) setForm(prev => ({ ...prev, price: (cost * markup).toFixed(2) }))
  }

  const applyMarkupPercent = (value) => {
    const cost = Number(form.buy_cost) || 0
    const percent = Number(value) || 0
    setForm(prev => ({
      ...prev,
      markup_percent: value,
      price: cost > 0 ? (cost * (1 + percent / 100)).toFixed(2) : prev.price
    }))
  }

  const applyProfitAmount = (value) => {
    const cost = Number(form.buy_cost) || 0
    const profit = Number(value) || 0
    setForm(prev => ({
      ...prev,
      profit_amount: value,
      price: cost > 0 ? (cost + profit).toFixed(2) : prev.price
    }))
  }

  const handleProductImageUpload = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const uploadFormData = new FormData()
    files.forEach(file => uploadFormData.append("images", file))

    setUploadingProductImages(true)
    try {
      const res = await authFetch("/upload", { method: "POST", body: uploadFormData })
      if (res.ok) {
        const { urls } = await res.json()
        setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }))
        toast("Product media uploaded to cloud")
      } else {
        toast("Media upload synchronization failed", "error")
      }
    } catch (err) {
      toast("Image service connection timeout", "error")
    } finally {
      setUploadingProductImages(false)
      event.target.value = null
    }
  }

  const removeImage = (index) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }))
  }

  const handleQuickCategoryAdd = async (event) => {
    event?.preventDefault()
    event?.stopPropagation()

    const categoryName = quickCategoryName.trim()
    if (!categoryName) return

    setQuickCategoryError("")
    const existingCategory = categoryOptions.find(category => category.name.toLowerCase() === categoryName.toLowerCase())
    if (existingCategory) {
      setForm(prev => ({ ...prev, category_id: existingCategory.id }))
      setQuickCategoryName("")
      return
    }

    setIsQuickAddingCategory(true)
    try {
      const res = await authFetch("/categories", {
        method: "POST",
        body: JSON.stringify({ name: categoryName })
      })
      const result = await res.json()
      if (!res.ok) {
        setQuickCategoryError(result.error || "Could not add category.")
        return
      }

      setCategoryOptions(prev => [...prev, result])
      setForm(prev => ({ ...prev, category_id: result.id }))
      setQuickCategoryName("")
      toast("Category added via quick-link")
    } catch (err) {
      setQuickCategoryError("Network error while adding category.")
    } finally {
      setIsQuickAddingCategory(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const quantity = Number(form.initial_quantity) || 0
    const buyCost = Number(form.buy_cost) || 0

    if (!isModify && quantity > 0 && buyCost <= 0) {
      toast("Acquisition cost is required for historical tracking", "error")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        brand_id: form.brand_id,
        category_id: form.category_id,
        uom_id: form.uom_id,
        price: form.price,
        expire: form.expire,
        warehouse_id: form.warehouse_id,
        source_supplier_id: supplier.id,
        source_unit_price: buyCost,
        images: form.images,
      }

      console.log("[DEBUG] Sending product payload to API:", payload)

      if (isModify) {
        // Quantity is read-only in modify mode to enforce PO-based stock management
      } else {
        payload.initial_quantity = quantity
        payload.source_purchase_quantity = quantity
      }

      const res = await authFetch(isModify ? `/products/${initialProduct.product_id}` : "/products", {
        method: isModify ? "PUT" : "POST",
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        toast(err.error || (isModify ? "Record update failed" : "New entry registration failed"), "error")
        return
      }

      toast(isModify ? "Product record modified successfully" : "New product added to catalog")
      onCreated()
    } catch (err) {
      toast("Database gateway error", "error")
    } finally {
      setSaving(false)
    }
  }

  const selectedUnit = units.find(unit => String(unit.id) === String(form.uom_id))
  const unitLabel = selectedUnit?.abbreviation || selectedUnit?.name || "unit"
  const quantity = Number(form.initial_quantity) || 0
  const buyCost = Number(form.buy_cost) || 0
  const sellPrice = Number(form.price) || 0
  const buyTotal = quantity * buyCost
  const sellTotal = quantity * sellPrice
  const profitPerUnit = sellPrice - buyCost
  const profitTotal = sellTotal - buyTotal
  const profitIsNegative = profitTotal < 0

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-box-bg dark:bg-box-dark-bg rounded-[1.75rem] shadow-2xl border border-box-border dark:border-box-dark-border overflow-hidden flex flex-col pointer-events-auto">
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{isModify ? "Modify Product" : "Add Product"}</h3>
            <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mt-1">Vendor: {supplier.name}</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={22}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <section className="rounded-[1.25rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-3">
              <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Product Basics</h4>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Product Name *</label>
                  <input required value={form.name} onChange={set("name")} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Description</label>
                  <textarea rows="1" value={form.description} onChange={set("description")} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner resize-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Brand *</label>
                    <select required value={form.brand_id} onChange={set("brand_id")} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                      <option value="" disabled>Select Brand</option>
                      {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Category *</label>
                    <select required value={form.category_id} onChange={set("category_id")} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                      <option value="" disabled>Select Category</option>
                      {categoryOptions.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                    <div className="mt-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Quick Add..."
                          value={quickCategoryName}
                          onChange={(event) => {
                            setQuickCategoryName(event.target.value)
                            if (quickCategoryError) setQuickCategoryError("")
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleQuickCategoryAdd(event)
                          }}
                          className="min-w-0 flex-1 px-2 py-1.5 text-[10px] bg-transparent outline-none font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-400"
                        />
                        <button type="button" onClick={handleQuickCategoryAdd} disabled={isQuickAddingCategory || !quickCategoryName.trim()} className="w-8 h-8 flex items-center justify-center bg-sky-500 text-white rounded-lg shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50 active:scale-95">
                          {isQuickAddingCategory ? <FiActivity className="animate-spin" size={14} /> : <FiPlus size={16}/>}
                        </button>
                      </div>
                      {quickCategoryError && (
                        <p className="px-2 pb-1 text-[9px] font-bold text-rose-500">{quickCategoryError}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Unit *</label>
                  <select required value={form.uom_id} onChange={set("uom_id")} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                    <option value="" disabled>Select Unit</option>
                    {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-[1.25rem] border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
              <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Pricing</h4>
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5">
                    <label className="block text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 px-1">Buy Cost / {unitLabel} *</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14}/>
                      <input required type="number" min="0" step="0.01" value={form.buy_cost} onChange={event => updateBuyCost(event.target.value)} className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 focus:border-emerald-500 outline-none shadow-inner font-black text-sm text-emerald-700 dark:text-emerald-300" />
                    </div>
                  </div>
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 p-2.5">
                    <label className="block text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1 px-1">Sell Price / {unitLabel} *</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" size={14}/>
                      <input required type="number" min="0" step="0.01" value={form.price} onChange={set("price")} className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-sky-900/40 focus:border-sky-500 outline-none shadow-inner font-black text-sm text-sky-700 dark:text-sky-300" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1.2, 1.3, 1.5].map(markup => (
                    <button key={markup} type="button" onClick={() => applyMarkup(markup)} className="py-2 rounded-xl bg-white dark:bg-slate-900 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-500 hover:text-white transition-all">
                      +{Math.round((markup - 1) * 100)}%
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Markup %</label>
                    <input type="number" min="0" step="0.01" placeholder="35" value={form.markup_percent} onChange={event => applyMarkupPercent(event.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Profit $</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={13}/>
                      <input type="number" min="0" step="0.01" placeholder="5.00" value={form.profit_amount} onChange={event => applyProfitAmount(event.target.value)} className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-3 py-2">
                    <p className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.18em]">Buy Total</p>
                    <p className="text-base font-black text-emerald-700 dark:text-emerald-300">${buyTotal.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 px-3 py-2">
                    <p className="text-[7px] font-black text-sky-600 uppercase tracking-[0.18em]">Sell Total</p>
                    <p className="text-base font-black text-sky-700 dark:text-sky-300">${sellTotal.toFixed(2)}</p>
                  </div>
                </div>
                <div className={`rounded-xl border px-3 py-2 ${profitIsNegative ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40" : "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[7px] font-black uppercase tracking-[0.18em] ${profitIsNegative ? "text-rose-600" : "text-violet-600"}`}>Profit / {unitLabel}</p>
                      <p className={`text-base font-black ${profitIsNegative ? "text-rose-700 dark:text-rose-300" : "text-violet-700 dark:text-violet-300"}`}>${profitPerUnit.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[7px] font-black uppercase tracking-[0.18em] ${profitIsNegative ? "text-rose-600" : "text-violet-600"}`}>Total Gain</p>
                      <p className={`text-xl font-black ${profitIsNegative ? "text-rose-700 dark:text-rose-300" : "text-violet-700 dark:text-violet-300"}`}>${profitTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[1.25rem] border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/10 p-3">
              <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Stock & Photos</h4>
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{isModify ? "Current Stock (Read Only)" : "Initial Qty"}</label>
                    <input 
                      type="number" 
                      readOnly={isModify}
                      value={form.initial_quantity} 
                      onChange={!isModify ? set("initial_quantity") : undefined} 
                      className={`w-full px-3 py-2 rounded-xl border border-transparent outline-none shadow-inner font-bold text-sm ${isModify ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-white dark:bg-slate-900 focus:border-sky-500"}`} 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Expire</label>
                    <input type="date" value={form.expire} onChange={set("expire")} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Warehouse</label>
                  <select value={form.warehouse_id} onChange={set("warehouse_id")} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.location})</option>)}
                  </select>
                </div>
                <label className={`h-16 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all shadow-inner ${uploadingProductImages ? "border-sky-400 bg-sky-50 dark:bg-sky-950/20" : "border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20"}`}>
                  {uploadingProductImages ? <FiActivity className="animate-spin text-sky-500" size={18}/> : <FiUploadCloud className="text-slate-300 dark:text-slate-600" size={20}/>}
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{uploadingProductImages ? "Uploading..." : "Upload Photos"}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleProductImageUpload} disabled={uploadingProductImages} />
                </label>
                <div className="min-h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2">
                  {form.images.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">No photos</div>
                  ) : (
                    <div className="grid grid-cols-5 gap-1.5">
                      {form.images.map((url, index) => (
                        <div key={url + index} className="relative aspect-square rounded-xl overflow-hidden border border-black/5 dark:border-white/10 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-lg bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                            <FiX size={11}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="px-8 py-2.5 text-xs font-black rounded-2xl text-white bg-sky-500 hover:bg-sky-600 shadow-xl shadow-sky-200 dark:shadow-none uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-60">
                {saving ? "Saving..." : (isModify ? "Save Changes" : "Save Product")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Supplier Details Modal ─── */
function SupplierDetailsModal({ supplier, brands, categories, units, warehouses, onClose, onReceive, onCancel, onUpdate, refreshKey = 0 }) {
  const { authFetch } = useAuth()
  const { toast } = useToast()
  const [history, setHistory] = useState([])
  const [catalog, setCatalog] = useState([])
  const [purchaseDetails, setPurchaseDetails] = useState({})
  const [detailLoading, setDetailLoading] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [productModalTarget, setProductModalTarget] = useState(null)
  const [activeSupplierTab, setActiveSupplierTab] = useState("catalog")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchSupplierDetails()
  }, [supplier.id, refreshKey])

  async function fetchSupplierDetails() {
    setHistory([])
    setCatalog([])
    setPurchaseDetails({})
    setDetailTarget(null)
    setProductModalTarget(null)
    setActiveSupplierTab("catalog")
    setLoading(true)
    try {
      const [historyRes, catalogRes] = await Promise.all([
        authFetch(`/suppliers/${supplier.id}/purchases`),
        authFetch(`/suppliers/${supplier.id}/products`)
      ])
      if (historyRes.ok) setHistory(await historyRes.json())
      if (catalogRes.ok) setCatalog(await catalogRes.json())
    } catch (err) {
      console.error("Fetch supplier details failed", err)
    } finally {
      setLoading(false)
    }
  }

  async function openPurchaseDetails(purchase) {
    const purchaseId = purchase.id
    setDetailTarget(purchase)
    if (purchaseDetails[purchaseId]) return

    setDetailLoading(purchaseId)
    try {
      const res = await authFetch(`/purchases/${purchaseId}`)
      if (res.ok) {
        const details = await res.json()
        setPurchaseDetails(prev => ({ ...prev, [purchaseId]: details }))
      }
    } catch (err) {
      console.error("Fetch purchase detail failed", err)
    } finally {
      setDetailLoading(null)
    }
  }

  async function openModifyProduct(item) {
    try {
      const res = await authFetch(`/products/${item.product_id}`)
      if (!res.ok) {
        toast("Failed to retrieve product specifications", "error")
        return
      }
      const product = await res.json()
      setProductModalTarget({
        ...item,
        ...product,
        mode: "modify",
        product_id: item.product_id,
        product_name: product.name || item.product_name,
        unit_price: item.unit_price,
      })
    } catch (err) {
      toast("Internal spec gateway error", "error")
    }
  }

  async function handleProductCreated() {
    setProductModalTarget(null)
    await fetchSupplierDetails()
    setActiveSupplierTab("catalog")
    if (onUpdate) onUpdate()
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)

    setUploading(true)
    try {
      const res = await authFetch(`/suppliers/${supplier.id}/image`, {
        method: "POST",
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        if (onUpdate) onUpdate()
        toast("Supplier identity photo updated")
      } else {
        const err = await res.json()
        toast(err.error || "Logo synchronization failed", "error")
      }
    } catch (err) {
      toast("Cloud storage upload error", "error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl h-[85vh] md:min-h-[640px] bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] shadow-2xl border border-box-border dark:border-box-dark-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-8 pt-7 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-5">
            <div 
              className="relative w-14 h-14 group cursor-pointer shrink-0"
              onClick={handleImageClick}
            >
              {supplier.image_url ? (
                <img 
                  src={supplier.image_url} 
                  alt={supplier.name} 
                  className="w-full h-full rounded-[1.5rem] object-cover shadow-xl border-2 border-white/20"
                />
              ) : (
                <span className={`w-full h-full rounded-[1.5rem] ${avatarColor(supplier.id)} flex items-center justify-center text-white text-xl font-black shadow-xl border-2 border-white/20`}>
                  {initials(supplier.name)}
                </span>
              )}
              
              <div className="absolute inset-0 bg-black/40 rounded-[1.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {uploading ? (
                  <FiLoader className="text-white animate-spin text-xl" />
                ) : (
                  <FiCamera className="text-white text-xl" />
                )}
              </div>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">{supplier.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
                 <span className="flex items-center gap-1.5"><FiMail size={12} className="text-sky-500"/> {supplier.email}</span>
                 {supplier.numbers?.map((num, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 text-violet-500"><FiPhone size={12}/> {num}</span>
                 ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setProductModalTarget({})} className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-sky-100 dark:shadow-none active:scale-95">
                <FiPlus size={16}/> Add Product
             </button>
             <button onClick={onClose} className="p-3 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={24} /></button>
          </div>
        </div>

        {/* Supplier Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
           <div className="flex-1 min-h-0 overflow-y-auto px-8 py-4 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                   <FiActivity size={40} className="text-violet-500 animate-spin opacity-40"/>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading Supplier Details...</p>
                </div>
              ) : (
                <div className="py-4 pb-10 min-h-full flex flex-col">
                  
                  <div className="shrink-0 grid grid-cols-2 gap-2 p-1.5 mb-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveSupplierTab("catalog")}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeSupplierTab === "catalog"
                          ? "bg-white dark:bg-slate-800 text-violet-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                    >
                      Products They Sell
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSupplierTab("history")}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeSupplierTab === "history"
                          ? "bg-white dark:bg-slate-800 text-sky-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                    >
                      Purchase History
                    </button>
                  </div>

                  {activeSupplierTab === "catalog" && (
                  <section className="flex-1 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                         <FiTruck className="text-violet-500" size={16}/> Product They Sell To Us
                      </h3>
                      <span className="text-[10px] font-black bg-violet-100 dark:bg-violet-950/50 text-violet-600 px-3 py-1 rounded-full uppercase tracking-widest">
                        {catalog.length} Products
                      </span>
                    </div>
                    {catalog.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                         <FiBox size={38} className="text-slate-300"/>
                         <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">No products linked to this vendor yet</p>
                         <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Add sources from a product detail page</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 p-5">
                        {catalog.map((item) => (
                          <div
                            key={item.id}
                            className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                                <FiBox size={18}/>
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.product_name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{item.brand_name || "No brand"} · {item.category_name || "No category"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cost to us</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">${Number(item.unit_price).toFixed(2)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openModifyProduct(item)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/20 text-sky-600 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all"
                              >
                                <FiEdit2 size={14}/> Modify
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                  )}

                  {activeSupplierTab === "history" && (
                  <section className="flex-1 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                         <FiShoppingBag className="text-sky-500" size={16}/> History We Bought
                      </h3>
                      <span className="text-[10px] font-black bg-sky-100 dark:bg-sky-950/50 text-sky-600 px-3 py-1 rounded-full uppercase tracking-widest">
                        {history.length} Orders
                      </span>
                    </div>
                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 gap-4 opacity-40 italic">
                         <FiShoppingBag size={48} className="text-slate-300"/>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">No orders found</p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-5">
                        {history.map((purchase) => {
                          return (
                            <div key={purchase.id} className="rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:border-sky-300 dark:hover:border-sky-900">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => openPurchaseDetails(purchase)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") openPurchaseDetails(purchase)
                                }}
                                className="w-full text-left p-5 hover:bg-sky-50/50 dark:hover:bg-sky-950/10 transition-all cursor-pointer"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2.5 text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5">
                                    <FiCalendar size={12} className="text-sky-500"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(purchase.date).toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'})}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border shadow-sm ${
                                      purchase.status === 'received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 
                                      purchase.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800' : 
                                      'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800'
                                    }`}>
                                      {purchase.status}
                                    </span>
                                    <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">View Detail</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-end">
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tracking ID</p>
                                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                      <FiShoppingBag className="text-sky-500" size={16}/>
                                      <p className="text-sm font-black text-slate-800 dark:text-white tracking-[0.1em]">PO-{purchase.id.toString().padStart(6, '0')}</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">{purchase.total_items} items in this shipment</p>
                                  </div>
                                  <div className="text-left md:text-right">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Total Price</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 md:justify-end tracking-tighter">
                                      <FiDollarSign className="text-emerald-500" size={18}/>
                                      {Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                  )}
                </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
           <button onClick={onClose} className="w-full py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.99] shadow-sm">Close</button>
        </div>
      </div>

      {detailTarget && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
          <div className="relative z-10 w-full max-w-3xl max-h-[82vh] bg-box-bg dark:bg-box-dark-bg rounded-[2rem] shadow-2xl border border-box-border dark:border-box-dark-border overflow-hidden flex flex-col pointer-events-auto">
            <div className="shrink-0 px-7 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Purchase Detail</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                  #{detailTarget.id.toString().padStart(6, "0")} · {new Date(detailTarget.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <button onClick={() => setDetailTarget(null)} className="p-3 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={22}/></button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-7 custom-scrollbar">
              {detailLoading === detailTarget.id ? (
                <div className="py-20 flex items-center justify-center gap-3 text-slate-400">
                  <FiActivity className="animate-spin" size={22}/>
                  <span className="text-[10px] font-black uppercase tracking-widest">Loading purchase detail...</span>
                </div>
              ) : purchaseDetails[detailTarget.id] ? (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       <div className="col-span-6">Product Item</div>
                       <div className="col-span-2 text-center">Price</div>
                       <div className="col-span-2 text-center">Qty</div>
                       <div className="col-span-2 text-right">Subtotal</div>
                    </div>
                    <div className="space-y-2">
                       {purchaseDetails[detailTarget.id].items?.map(item => (
                         <div key={item.id} className="grid grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-sky-100">
                            <div className="col-span-6 flex items-center gap-4">
                               <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                  {item.image_url ? (
                                    <img 
                                      src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FiActivity size={20} className="text-slate-200"/>
                                  )}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.product_name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: #{item.product_id}</p>
                               </div>
                            </div>
                            <div className="col-span-2 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
                               ${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="col-span-2 text-center">
                               <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
                                  {item.quantity}
                               </span>
                            </div>
                            <div className="col-span-2 text-right text-xs font-black text-slate-900 dark:text-white">
                               ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-6 py-5">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Sum of all price</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">${Number(purchaseDetails[detailTarget.id].total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>

                  {purchaseDetails[detailTarget.id].note && (
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 px-6 py-5">
                      <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <FiActivity size={12}/> Order Note
                      </p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">"{purchaseDetails[detailTarget.id].note}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-xs font-black text-rose-400 uppercase tracking-widest">Could not load purchase detail</div>
              )}
            </div>
          </div>
        </div>
      )}

      {productModalTarget && (
        <SupplierProductCreateModal
          supplier={supplier}
          initialProduct={productModalTarget.id ? productModalTarget : null}
          brands={brands}
          categories={categories}
          units={units}
          warehouses={warehouses}
          onClose={() => setProductModalTarget(null)}
          onCreated={handleProductCreated}
        />
      )}
    </div>
  )
}

/* ─── Supplier modal ─── */
function SupplierModal({ initial, onSave, onClose }) {
  const { authFetch } = useAuth()
  const isEdit = !!initial?.id
  const [form, setForm] = useState(() => {
    if (initial) {
      // If we have an initial supplier, we might need to map its current image to the images array
      return {
        ...initial,
        images: initial.images?.map(img => img.url) || (initial.image_url ? [initial.image_url] : [])
      }
    }
    return EMPTY
  })
  const [errors, setErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  
  const updateNumber = (idx, val) => {
    const newNumbers = [...form.numbers]
    newNumbers[idx] = val
    setForm(p => ({ ...p, numbers: newNumbers }))
  }
  const addNumber = () => setForm(p => ({ ...p, numbers: [...p.numbers, ""] }))
  const removeNumber = (idx) => setForm(p => ({ ...p, numbers: p.numbers.filter((_, i) => i !== idx) }))

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const uploadFormData = new FormData()
    files.forEach(file => uploadFormData.append('images', file))

    setIsUploading(true)
    try {
      const response = await authFetch("/upload", { method: "POST", body: uploadFormData })
      if (response.ok) {
        const { urls } = await response.json()
        setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }))
      }
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIsUploading(false)
      e.target.value = null
    }
  }

  const removeImage = (idx) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }))
  }

  function validate() {
    const e = {}
    if (!form.name?.trim())      e.name    = "Required"
    if (!form.numbers?.some(n => n.trim())) e.numbers = "At least one number is required"
    if (!form.email?.trim())     e.email   = "Required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid format"
    if (!form.address?.trim())   e.address = "Required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) onSave(form)
  }

  const wrap = (f, hasError) => `flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all ${
    hasError
      ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20 shadow-inner"
      : "border-box-border dark:border-box-dark-border bg-slate-50 dark:bg-slate-950 focus-within:border-sky-500 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-inner"
  }`
  const inp = "flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 font-bold outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] shadow-2xl border border-box-border dark:border-box-dark-border overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
              {isEdit ? "Edit Supplier" : "Add Supplier"}
            </h2>
            <button onClick={onClose} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={22}/></button>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] px-1">Configure Supplier Info</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="px-8 py-7 flex flex-col gap-6 bg-white dark:bg-slate-900/20">
            
            {/* Image Upload Area */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Supplier Photos</label>
              <div className="flex flex-wrap gap-3">
                {form.images?.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 group">
                    <img src={url} className="w-full h-full object-cover rounded-2xl border border-black/5 dark:border-white/10" alt="" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                
                <label className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all
                  ${isUploading ? 'border-sky-400 bg-sky-50/30' : 'border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-sky-50/30'}`}>
                  {isUploading ? (
                    <FiLoader className="text-sky-500 animate-spin" size={20} />
                  ) : (
                    <>
                      <FiUploadCloud className="text-slate-400" size={20} />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Upload</span>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Supplier Name</label>
              <div className={wrap("name", errors.name)}>
                <FiTruck size={16} className="text-slate-300 dark:text-slate-600 shrink-0"/>
                <input type="text" value={form.name || ""} onChange={set("name")} placeholder="e.g. Acme Supplies" className={inp}/>
              </div>
              {errors.name && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-widest animate-pulse">{errors.name}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Numbers</label>
                <button type="button" onClick={addNumber} className="text-[10px] font-black text-sky-500 uppercase tracking-widest flex items-center gap-1 hover:text-sky-600"><FiPlusCircle size={14}/> Add</button>
              </div>
              <div className="space-y-3">
                {form.numbers.map((num, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className={wrap("numbers", false)}>
                      <FiPhone size={16} className="text-slate-300 dark:text-slate-600 shrink-0"/>
                      <input type="tel" value={num} onChange={e => updateNumber(idx, e.target.value)} placeholder="e.g. 023-400-5000" className={inp}/>
                      {form.numbers.length > 1 && (
                        <button type="button" onClick={() => removeNumber(idx)} className="text-rose-400 hover:text-rose-600 p-1"><FiMinusCircle size={16}/></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.numbers && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-widest animate-pulse">{errors.numbers}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Email Address</label>
              <div className={wrap("email", errors.email)}>
                <FiMail size={16} className="text-slate-300 dark:text-slate-600 shrink-0"/>
                <input type="email" value={form.email || ""} onChange={set("email")} placeholder="e.g. orders@acme.com" className={inp}/>
              </div>
              {errors.email && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-widest animate-pulse">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Office Address</label>
              <div className={wrap("address", errors.address)}>
                <FiMapPin size={16} className="text-slate-300 dark:text-slate-600 shrink-0"/>
                <input type="text" value={form.address || ""} onChange={set("address")} placeholder="Industrial Zone, Building 4" className={inp}/>
              </div>
              {errors.address && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-widest animate-pulse">{errors.address}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-7 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-8 py-4 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Cancel</button>
            <button type="submit" className="px-10 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-[10px] shadow-xl shadow-sky-200 dark:shadow-none uppercase tracking-[0.2em] transition-all active:scale-95">
              {isEdit ? "Update Supplier" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MonthlyPurchaseChart({ suppliers }) {
  const monthly = Array.from({ length: 12 }, () => 0)
  suppliers.forEach(supplier => {
    supplier.recent_purchases?.forEach(purchase => {
      const date = new Date(purchase.date)
      if (!Number.isNaN(date.getTime())) monthly[date.getMonth()] += Number(purchase.total_amount) || 0
    })
  })
  const max = Math.max(...monthly, 1)
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <Card className="p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">Monthly Purchase Orders</h3>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">This Year</span>
      </div>
      <div className="h-40 flex items-end gap-3 border-b border-slate-100 dark:border-slate-800 px-1">
        {monthly.map((amount, index) => (
          <div key={labels[index]} className="flex-1 h-full flex flex-col justify-end gap-2">
            <div className="relative h-full flex items-end">
              <div
                className="w-full rounded-t-lg bg-sky-500 shadow-sm shadow-sky-100 dark:shadow-none min-h-[8px]"
                style={{ height: `${Math.max(8, (amount / max) * 100)}%` }}
                title={`$${amount.toFixed(2)}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-3 pt-3 px-1">
        {labels.map(label => (
          <span key={label} className="text-[9px] font-bold text-slate-400 text-center">{label}</span>
        ))}
      </div>
    </Card>
  )
}

function SupplierWorkloadChart({ suppliers }) {
  const topSuppliers = [...suppliers]
    .sort((a, b) => ((b.source_count || 0) + (b.purchase_count || 0)) - ((a.source_count || 0) + (a.purchase_count || 0)))
    .slice(0, 5)
  const max = Math.max(...topSuppliers.map(supplier => (supplier.source_count || 0) + (supplier.purchase_count || 0)), 1)

  return (
    <Card className="p-5 rounded-2xl">
      <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight mb-5">Supplier Workload</h3>
      <div className="space-y-4">
        {topSuppliers.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs font-black text-slate-300 uppercase tracking-widest">No supplier data</div>
        ) : topSuppliers.map(supplier => {
          const value = (supplier.source_count || 0) + (supplier.purchase_count || 0)
          return (
            <div key={supplier.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">{supplier.name}</p>
                <p className="text-[10px] font-black text-slate-400">{supplier.source_count || 0} products · {supplier.purchase_count || 0} orders</p>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function SupplierProfilePanel({ supplier, onClose, onView, onEdit, onNewPO }) {
  if (!supplier) {
    return (
      <aside className="hidden xl:flex w-[360px] shrink-0 rounded-[2rem] border border-box-border dark:border-box-dark-border bg-box-bg dark:bg-box-dark-bg items-center justify-center text-center p-8">
        <div>
          <FiTruck className="mx-auto text-slate-300 mb-4" size={42} />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Supplier</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-full xl:w-[360px] shrink-0 rounded-[2rem] border border-box-border dark:border-box-dark-border bg-box-bg dark:bg-box-dark-bg overflow-hidden flex flex-col min-h-0">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800 dark:text-white">Supplier Profile</h2>
        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><FiX size={18}/></button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {supplier.image_url ? (
              <img src={supplier.image_url} alt={supplier.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800" />
            ) : (
              <span className={`w-16 h-16 rounded-2xl ${avatarColor(supplier.id)} flex items-center justify-center text-white text-lg font-black`}>
                {initials(supplier.name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800 dark:text-white truncate">{supplier.name}</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SUP{String(supplier.id).padStart(3, "0")}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">{supplier.source_count || 0} product sources</p>
            </div>
          </div>
        </div>

        <section className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-4">Contact Information</h4>
          <div className="space-y-3 text-xs font-bold text-slate-500 dark:text-slate-300">
            <p className="flex items-center gap-3"><FiPhone className="text-slate-400" /> {supplier.numbers?.[0] || "No phone"}</p>
            <p className="flex items-center gap-3"><FiMail className="text-slate-400" /> <span className="truncate">{supplier.email}</span></p>
            <p className="flex items-start gap-3"><FiMapPin className="text-slate-400 mt-0.5 shrink-0" /> <span>{supplier.address}</span></p>
          </div>
        </section>

        <section className="p-5">
          <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-4">Payment Summary</h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between"><span className="font-bold text-slate-400">Total Pending Price</span><span className="font-black text-amber-500">${Number(supplier.total_pending_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="font-bold text-slate-400">Total Bought</span><span className="font-black text-slate-800 dark:text-white">${Number(supplier.total_bought_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="font-bold text-slate-400">Purchase Orders</span><span className="font-black text-slate-800 dark:text-white">{supplier.purchase_count || 0}</span></div>
          </div>
        </section>      </div>

      <div className="p-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
        <button onClick={onView} className="py-3 rounded-xl bg-sky-500 text-white text-[9px] font-black uppercase tracking-widest">View</button>
        <button onClick={onEdit} className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest">Edit</button>
        <button onClick={onNewPO} className="py-3 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest">New PO</button>
      </div>
    </aside>
  )
}

/* ─── Page ─── */
export default function Suppliers() {
  const { authFetch, user } = useAuth()
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [sort,      setSort]      = useState({ field:"name", dir:"asc" })
  
  // Modal states
  const [modal,     setModal]     = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState(null)
  const [poTarget, setPoTarget] = useState(null)
  const [receiveTarget, setReceiveTarget] = useState(null)
  const [detailRefreshKey, setDetailRefreshKey] = useState(0)

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [sRes, wRes, bRes, cRes, uRes] = await Promise.all([
        authFetch("/suppliers"),
        authFetch("/inventory/warehouses"),
        authFetch("/brands"),
        authFetch("/categories"),
        authFetch("/units")
      ])
      if (sRes.ok) setSuppliers(await sRes.json())
      if (wRes.ok) setWarehouses(await wRes.json())
      if (bRes.ok) setBrands(await bRes.json())
      if (cRes.ok) setCategories(await cRes.json())
      if (uRes.ok) setUnits(await uRes.json())
    } catch (err) {
      console.error("Critical error", err)
    } finally {
      setLoading(false)
    }
  }

  const totalPurchases = suppliers.reduce((s, p) => s + (p.purchases?.length || 0), 0)
  const totalSourceProducts = suppliers.reduce((sum, supplier) => sum + (supplier.source_count || 0), 0)
  const totalPurchaseOrders = suppliers.reduce((sum, supplier) => sum + (supplier.purchase_count || 0), 0)
  const pendingOrders = suppliers.reduce((sum, supplier) => sum + (supplier.pending_purchase_count || 0), 0)
  const outstandingAmount = suppliers.reduce((sum, supplier) => sum + Number(supplier.outstanding_amount || 0), 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return suppliers
      .filter(s =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.numbers || []).some(n => n.includes(q)) ||
        (s.address || "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const va = sort.field === "purchases" ? (a.purchase_count || 0) : a[sort.field]
        const vb = sort.field === "purchases" ? (b.purchase_count || 0) : b[sort.field]
        if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === "asc" ? va - vb : vb - va
      })
  }, [suppliers, search, sort])

  const selectedSupplier = useMemo(() => {
    if (selectedSupplierId) {
      const selected = suppliers.find(supplier => supplier.id === selectedSupplierId)
      if (selected) return selected
    }
    return filtered[0] || suppliers[0] || null
  }, [selectedSupplierId, suppliers, filtered])

  function handleSort(f) {
    setSort(s => s.field === f ? { field:f, dir: s.dir==="asc" ? "desc" : "asc" } : { field:f, dir:"asc" })
  }

  async function handleSave(form) {
    const isEdit = !!modal.data?.id
    const url = isEdit ? `/suppliers/${modal.data.id}` : "/suppliers"
    const method = isEdit ? "PUT" : "POST"

    try {
      const res = await authFetch(url, { method, body: JSON.stringify(form) })
      if (res.ok) { 
        toast(isEdit ? "Supplier profile updated" : "New vendor registered")
        setModal(null); 
        fetchInitialData() 
      }
      else { toast((await res.json()).error || "Registration failure", "error") }
    } catch (err) { toast("Vendor gateway timeout", "error") }
  }

  async function handleDelete() {
    if (!delTarget) return
    try {
      const res = await authFetch(`/suppliers/${delTarget.id}`, { method: "DELETE" })
      if (res.ok) { 
        toast("Supplier purged from system")
        fetchInitialData(); 
        setDelTarget(null) 
      }
      else { toast((await res.json()).error, "error") }
    } catch (err) { toast("Deletion procedure failed", "error") }
  }

  async function handleCreatePO(data) {
    try {
      const res = await authFetch("/purchases", { method: "POST", body: JSON.stringify(data) })
      if (res.ok) { 
        toast("Purchase Order finalized and pending approval")
        setPoTarget(null); 
        fetchInitialData() 
      }
      else { toast((await res.json()).error, "error") }
    } catch (err) { toast("PO generation failed", "error") }
  }

  async function handleReceive(id, warehouse_id) {
    try {
      const res = await authFetch(`/purchases/${id}/status`, { 
        method: "PUT", 
        body: JSON.stringify({ status: "received", warehouse_id }) 
      })
      if (res.ok) {
        toast("Stock successfully received into warehouse inventory")
        setReceiveTarget(null)
        setDetailRefreshKey(key => key + 1)
        fetchInitialData()
      }
      else { 
        const errData = await res.json()
        toast(errData.error || "Inventory update failed", "error") 
      }
    } catch (err) { toast("Inventory update failed", "error") }
  }

  async function handleCancel(id) {
    if (!window.confirm("Cancel this purchase order? This action is permanent.")) return
    try {
      const res = await authFetch(`/purchases/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" })
      })
      if (res.ok) {
        toast("Purchase order cancelled and closed")
        setDetailRefreshKey(key => key + 1)
        fetchInitialData()
      } else {
        const errData = await res.json()
        toast(errData.error || "Action failed", "error")
      }
    } catch (err) { toast("Network synchronization error", "error") }
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg transition-all duration-300">
      <div className="h-full p-5 flex flex-col gap-4 overflow-hidden">
        <div className="shrink-0 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Supplier Management</h1>
          <div className="flex flex-1 lg:max-w-2xl items-center gap-3">
            <div className="relative flex-1 group">
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search suppliers by name, contact, email..."
                className="w-full bg-box-bg dark:bg-box-dark-bg pl-12 pr-5 py-3.5 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-bold outline-none border border-box-border dark:border-box-dark-border focus:border-sky-500 transition-all shadow-sm"
              />
            </div>
            <button onClick={() => setModal({ mode:"add" })}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-lg shadow-blue-100 dark:shadow-none active:scale-95">
              <FiPlus size={16}/> Add Supplier
            </button>
          </div>
        </div>

        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard icon={FiUsers} label="Total Suppliers" value={suppliers.length}
            iconClass="text-blue-600 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
          <StatCard icon={FiActivity} label="Vendor Catalog Items"  value={`${totalSourceProducts} Links`}
            iconClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
          <StatCard icon={FiShoppingBag} label="Pending Orders" value={pendingOrders}
            iconClass="text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
          <StatCard icon={FiCreditCard} label="Outstanding Payments" value={`$${outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            iconClass="text-violet-600 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
        </div>

        <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
            <Card className="flex-[1.25] min-h-0 flex flex-col overflow-hidden rounded-2xl">
              <div className="shrink-0 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Suppliers</span>
                  <button onClick={() => setSearch("")} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <FiRefreshCw size={12}/> Clear Filters
                  </button>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {filtered.length} of {suppliers.length} suppliers
                </p>
              </div>

              <div className="overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-sky-500 animate-spin opacity-40">
                    <FiActivity size={48} />
                  </div>
                ) : (
                  <table className="w-full table-fixed border-collapse">
                    <thead className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <SortTh label="Supplier ID" field="id" sort={sort} onSort={handleSort} className="pl-4 w-[12%]"/>
                        <SortTh label="Supplier Name" field="name" sort={sort} onSort={handleSort}/>
                        <th className="px-3 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[14%]">Phone</th>
                        <SortTh label="Email" field="email" sort={sort} onSort={handleSort}/>
                        <th className="px-3 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[10%]">Products</th>
                        <SortTh label="Orders" field="purchases" sort={sort} onSort={handleSort} className="w-[9%]"/>
                        <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-[15%]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                      {filtered.length === 0 ? (
                        <tr><td colSpan={7} className="py-24 text-center text-sm font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">No suppliers found</td></tr>
                      ) : filtered.map(s => {
                        const isSelected = selectedSupplier?.id === s.id
                        return (
                          <tr
                            key={s.id}
                            onClick={() => setSelectedSupplierId(s.id)}
                            className={`transition-all group cursor-pointer ${isSelected ? "bg-sky-50/70 dark:bg-sky-950/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                          >
                            <td className="pl-4 pr-3 py-4 text-xs font-black text-slate-500 dark:text-slate-300 truncate">SUP{String(s.id).padStart(3, "0")}</td>
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-3">
                                {s.image_url ? (
                                  <img src={s.image_url} alt={s.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800" />
                                ) : (
                                  <span className={`w-10 h-10 rounded-xl ${avatarColor(s.id)} flex items-center justify-center text-white text-[10px] font-black shrink-0`}>
                                    {initials(s.name)}
                                  </span>
                                )}
                                <p className="text-xs font-black text-slate-800 dark:text-white truncate">{s.name}</p>
                              </div>
                            </td>
                            <td className="px-3 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{s.numbers?.[0] || "—"}</td>
                            <td className="px-3 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{s.email}</td>
                            <td className="px-3 py-4 text-xs font-black text-slate-700 dark:text-slate-200">{s.source_count || 0}</td>
                            <td className="px-3 py-4 text-xs font-black text-slate-700 dark:text-slate-200">{s.purchase_count || 0}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={(e) => { e.stopPropagation(); setViewTarget(s) }}
                                  title="View"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 hover:bg-blue-100 transition-all">
                                  <FiEye size={13}/>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setModal({ mode:"edit", data:s }) }}
                                  title="Edit"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-sky-600 hover:bg-slate-100 transition-all">
                                  <FiEdit2 size={13}/>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDelTarget(s) }}
                                  title="Delete"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 transition-all">
                                  <FiTrash2 size={13}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
              <MonthlyPurchaseChart suppliers={suppliers} />
              <SupplierWorkloadChart suppliers={suppliers} />
            </div>
          </div>

          <SupplierProfilePanel
            supplier={selectedSupplier}
            onClose={() => setSelectedSupplierId(null)}
            onView={() => selectedSupplier && setViewTarget(selectedSupplier)}
            onEdit={() => selectedSupplier && setModal({ mode:"edit", data:selectedSupplier })}
            onNewPO={() => selectedSupplier && setPoTarget(selectedSupplier)}
          />
        </div>

        {modal      && <SupplierModal initial={modal.mode==="edit" ? modal.data : undefined} onSave={handleSave} onClose={() => setModal(null)}/>}
        {delTarget  && <ConfirmDelete name={delTarget.name} onConfirm={handleDelete} onClose={() => setDelTarget(null)}/>}
        
        {viewTarget && (
          <SupplierDetailsModal 
            supplier={viewTarget} 
            brands={brands}
            categories={categories}
            units={units}
            warehouses={warehouses}
            onClose={() => setViewTarget(null)}
            onReceive={(p) => setReceiveTarget(p)}
            onCancel={handleCancel}
            onUpdate={fetchInitialData}            refreshKey={detailRefreshKey}
          />
        )}

        {poTarget && (
          <PurchaseOrderModal 
            supplier={poTarget} 
            onClose={() => setPoTarget(null)} 
            onSave={handleCreatePO}
          />
        )}

        {receiveTarget && (
          <ReceiptModal 
            purchase={receiveTarget} 
            warehouses={warehouses} 
            onClose={() => setReceiveTarget(null)} 
            onConfirm={handleReceive}
          />
        )}
      </div>
    </div>
  )
}
