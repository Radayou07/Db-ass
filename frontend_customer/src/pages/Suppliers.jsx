import { useState, useEffect, useMemo, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
  FiTruck, FiUsers, FiMail, FiPhone, FiMapPin,
  FiChevronUp, FiChevronDown, FiAlertTriangle, FiActivity, FiCalendar, FiDollarSign, FiShoppingBag, FiLayers, FiCheck, FiPlusCircle, FiMinusCircle, FiTag, FiBox, FiCamera, FiLoader, FiUploadCloud
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

/* ─── Quick Add Product Modal ─── */
function QuickAddProductModal({ categories, units, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", price: 0, category_id: categories[0]?.id || "", uom_id: units[0]?.id || "", company: "Wholesale" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
       <div className="bg-box-bg dark:bg-box-dark-bg w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-box-border dark:border-box-dark-border">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
             <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter text-xl"><FiBox className="text-sky-500" size={24}/> Add Product</h2>
             <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Product Name</label>
                <input required placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-sm font-bold shadow-inner" />
             </div>
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Brand</label>
                <input required placeholder="Brand Name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-sm font-bold shadow-inner" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Category</label>
                   <select required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-xs font-black shadow-inner appearance-none cursor-pointer">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Unit</label>
                   <select required value={form.uom_id} onChange={e => setForm({...form, uom_id: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-sky-500 outline-none text-xs font-black shadow-inner appearance-none cursor-pointer">
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                </div>
             </div>
             <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={onClose} className="flex-1 py-4 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-[10px] shadow-xl shadow-sky-200 dark:shadow-none uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95">
                   {loading ? "Adding..." : "Save Product"}
                </button>
             </div>
          </form>
       </div>
    </div>
  )
}

/* ─── Purchase Order Modal (Create Order) ─── */
function PurchaseOrderModal({ supplier, products, onClose, onSave }) {
  const [items, setItems] = useState([{ product_id: "", quantity: 1, price: 0 }])
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  const addItem = () => setItems([...items, { product_id: "", quantity: 1, price: 0 }])
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))
  
  const updateItem = (idx, field, val) => {
    const newItems = [...items]
    newItems[idx][field] = val
    if (field === 'product_id') {
      const p = products.find(p => String(p.id) === String(val))
      if (p) newItems[idx].price = p.last_cost || p.price * 0.8 
    }
    setItems(newItems)
  }

  const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.some(i => !i.product_id || i.quantity <= 0)) return alert("Invalid items in list")
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Product List</label>
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
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

/* ─── Supplier Details Modal ─── */
function SupplierDetailsModal({ supplier, onClose, onCreateOrder, onReceive, onUpdate }) {
  const { authFetch } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchHistory()
  }, [supplier.id])

  async function fetchHistory() {
    setHistory([])
    setLoading(true)
    try {
      const res = await authFetch(`/suppliers/${supplier.id}/purchases`)
      if (res.ok) setHistory(await res.json())
    } catch (err) {
      console.error("Fetch history failed", err)
    } finally {
      setLoading(false)
    }
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
        alert("Supplier image updated!")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to upload image")
      }
    } catch (err) {
      alert("Upload error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] shadow-2xl border border-box-border dark:border-box-dark-border flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-6 border-b border-slate-100 dark:border-slate-800">
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
             <button onClick={onCreateOrder} className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-sky-100 dark:shadow-none active:scale-95">
                <FiPlus size={16}/> New Order
             </button>
             <button onClick={onClose} className="p-3 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={24} /></button>
          </div>
        </div>

        {/* History Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
           <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <FiTruck className="text-violet-500" size={16}/> Purchase History
              </h3>
              <span className="text-[10px] font-black bg-violet-100 dark:bg-violet-950/50 text-violet-600 px-3 py-1 rounded-full uppercase tracking-widest">
                {history.length} Orders
              </span>
           </div>

           <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                   <FiActivity size={40} className="text-violet-500 animate-spin opacity-40"/>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Loading History...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-40 italic">
                   <FiShoppingBag size={48} className="text-slate-300"/>
                   <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">No orders found</p>
                </div>
              ) : (
                <div className="space-y-4 py-4 pb-10">
                   {history.map((purchase) => (
                     <div key={purchase.id} className="group p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-violet-400/50 transition-all shadow-sm hover:shadow-xl group">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2.5 text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/5">
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
                              <div className="text-[10px] font-black text-slate-300 group-hover:text-violet-500 transition-colors">#{purchase.id.toString().padStart(6, '0')}</div>
                           </div>
                        </div>
                        <div className="flex items-end justify-between px-1">
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Items</p>
                              <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{purchase.total_items} Products <span className="text-slate-300 dark:text-slate-600 font-bold ml-1 text-sm">ORDERED</span></p>
                           </div>
                           <div className="flex items-center gap-5">
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-emerald-500">Amount</p>
                                 <p className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end tracking-tighter">
                                    <FiDollarSign className="text-emerald-500" size={18}/>
                                    {Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                 </p>
                              </div>
                              {purchase.status === 'pending' && (
                                <button 
                                  onClick={() => onReceive(purchase)}
                                  className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.25rem] shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-90 flex items-center justify-center border-4 border-white dark:border-slate-800"
                                  title="Receive Items"
                                >
                                   <FiCheck size={24} strokeWidth={4}/>
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
           <button onClick={onClose} className="w-full py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.99] shadow-sm">Close</button>
        </div>
      </div>
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

/* ─── Page ─── */
export default function Suppliers() {
  const { authFetch, user } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [sort,      setSort]      = useState({ field:"name", dir:"asc" })
  
  // Modal states
  const [modal,     setModal]     = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [poTarget, setPoTarget] = useState(null)
  const [receiveTarget, setReceiveTarget] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [sRes, pRes, wRes, cRes, uRes] = await Promise.all([
        authFetch("/suppliers"),
        authFetch("/products"),
        authFetch("/inventory/warehouses"),
        authFetch("/categories"),
        authFetch("/units")
      ])
      if (sRes.ok) setSuppliers(await sRes.json())
      if (pRes.ok) setProducts(await pRes.json())
      if (wRes.ok) setWarehouses(await wRes.json())
      if (cRes.ok) setCategories(await cRes.json())
      if (uRes.ok) setUnits(await uRes.json())
    } catch (err) {
      console.error("Critical error", err)
    } finally {
      setLoading(false)
    }
  }

  const totalPurchases = suppliers.reduce((s, p) => s + (p.purchases?.length || 0), 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return suppliers
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.numbers.some(n => n.includes(q)) ||
        s.address.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const va = sort.field === "purchases" ? (a.purchases?.length || 0) : a[sort.field]
        const vb = sort.field === "purchases" ? (b.purchases?.length || 0) : b[sort.field]
        if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === "asc" ? va - vb : vb - va
      })
  }, [suppliers, search, sort])

  function handleSort(f) {
    setSort(s => s.field === f ? { field:f, dir: s.dir==="asc" ? "desc" : "asc" } : { field:f, dir:"asc" })
  }

  async function handleSave(form) {
    const isEdit = !!modal.data?.id
    const url = isEdit ? `/suppliers/${modal.data.id}` : "/suppliers"
    const method = isEdit ? "PUT" : "POST"

    try {
      const res = await authFetch(url, { method, body: JSON.stringify(form) })
      if (res.ok) { setModal(null); fetchInitialData() }
      else { alert((await res.json()).error || "Save error.") }
    } catch (err) { alert("Network failure.") }
  }

  async function handleDelete() {
    if (!delTarget) return
    try {
      const res = await authFetch(`/suppliers/${delTarget.id}`, { method: "DELETE" })
      if (res.ok) { fetchInitialData(); setDelTarget(null) }
      else { alert((await res.json()).error) }
    } catch (err) { alert("Delete error.") }
  }

  async function handleCreatePO(data) {
    try {
      const res = await authFetch("/purchases", { method: "POST", body: JSON.stringify(data) })
      if (res.ok) { setPoTarget(null); fetchInitialData() }
      else { alert((await res.json()).error) }
    } catch (err) { alert("Failed to create order.") }
  }

  async function handleReceive(id, warehouse_id) {
    try {
      const res = await authFetch(`/purchases/${id}/status`, { 
        method: "PUT", 
        body: JSON.stringify({ status: "received", warehouse_id }) 
      })
      if (res.ok) { setReceiveTarget(null); fetchInitialData() }
      else { alert((await res.json()).error) }
    } catch (err) { alert("Failed to update stock.") }
  }

  const handleQuickProductAdd = async (prodData) => {
     try {
        const res = await authFetch("/products", { method: "POST", body: JSON.stringify(prodData) })
        if (res.ok) {
           const result = await res.json()
           const pListRes = await authFetch("/products")
           const pList = await pListRes.json()
           setProducts(pList)
           return pList.find(p => p.id === result.id)
        } else { 
          const err = await res.json()
          alert(err.error || "Failed to add product.") 
        }
     } catch (err) { alert("Network error.") }
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg transition-all duration-300">
      <div className="h-full p-6 flex flex-col gap-6 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between bg-box-bg dark:bg-box-dark-bg p-6 rounded-[2rem] border border-box-border dark:border-box-dark-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Suppliers</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-1 font-black uppercase tracking-[0.3em]">Manage your product sources</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-700 dark:text-slate-100 uppercase tracking-tighter">{user?.name || "System"}</p>
                <p className="text-[9px] font-black text-sky-500 uppercase tracking-[0.2em]">{user?.role} Access</p>
             </div>
             <button onClick={() => setModal({ mode:"add" })}
               className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600
                          text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-sky-200 dark:shadow-none active:scale-95">
               <FiPlus size={18}/> Add Supplier
             </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 shrink-0">
          <StatCard icon={FiTruck} label="Active Suppliers" value={suppliers.length}
            iconClass="text-sky-500 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
          <StatCard icon={FiActivity} label="Products Linked"  value={`${products.length} Items`}
            iconClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
          <StatCard icon={FiShoppingBag}  label="Total Orders" value={totalPurchases}
            iconClass="text-violet-500 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-800" cardClass="bg-box-bg dark:bg-box-dark-bg"/>
        </div>

        {/* Main Interface */}
        <Card className="flex-1 flex flex-col overflow-hidden bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border rounded-[2.5rem]">
           <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between gap-4">
              <div className="relative flex-1 group">
                 <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                 <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Search suppliers by name, contact, or location…"
                   className="w-full bg-slate-50 dark:bg-slate-950/50 pl-12 pr-6 py-4 rounded-[1.5rem] text-sm text-slate-700 dark:text-slate-200
                              placeholder:text-slate-400 font-bold outline-none border border-transparent focus:border-sky-500 transition-all shadow-inner"/>
              </div>
              <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-2xl border border-black/5 dark:border-white/5">
                 <button onClick={()=>setSort({field:"name", dir:sort.dir==="asc"?"desc":"asc"})} className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-500 transition-all">Name</button>
                 <button onClick={()=>setSort({field:"purchases", dir:"desc"})} className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-violet-500 transition-all">Orders</button>
              </div>
           </div>

           <div className="overflow-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sky-500 animate-spin opacity-40">
                <FiActivity size={48} />
              </div>
            ) : (
              <table className="w-full min-w-[800px] border-collapse">
                <thead className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <SortTh label="Supplier Name" field="name"      sort={sort} onSort={handleSort} className="pl-8"/>
                    <SortTh label="Phone Number"        field="number"    sort={sort} onSort={handleSort}/>
                    <SortTh label="Location"      field="address"   sort={sort} onSort={handleSort}/>
                    <SortTh label="Orders"            field="purchases" sort={sort} onSort={handleSort}/>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {suppliers.length === 0 ? (
                   <tr><td colSpan={5} className="py-24 text-center text-sm font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">No suppliers found</td></tr>
                  ) : (
                    filtered.map(s => (
                      <tr key={s.id} 
                        onClick={() => setViewTarget(s)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group cursor-pointer"
                      >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          {s.image_url ? (
                             <img 
                               src={s.image_url} 
                               alt={s.name} 
                               className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white/20"
                             />
                          ) : (
                            <span className={`w-12 h-12 rounded-2xl ${avatarColor(s.id)} flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg border-2 border-white/20`}>
                              {initials(s.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                             <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate">{s.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-500 dark:text-slate-400 font-black tracking-tighter whitespace-nowrap">
                        {s.numbers?.[0] || "—"}
                        {s.numbers?.length > 1 && <span className="ml-1 text-[8px] text-sky-500 font-black">+{s.numbers.length - 1} MORE</span>}
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-500 dark:text-slate-400 max-w-[220px] truncate font-medium">{s.address}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center justify-center w-10 h-7 rounded-xl text-xs font-black
                                         bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800 shadow-sm">
                          {s.purchases?.length || 0}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                          <button onClick={(e) => { e.stopPropagation(); setModal({ mode:"edit", data:s }) }}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-sky-500 shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-90">
                            <FiEdit2 size={16}/>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDelTarget(s) }}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-90">
                            <FiTrash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                    )))}
                    </tbody>
              </table>
            )}
          </div>
          <div className="px-8 py-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Live suppliers: <span className="text-slate-800 dark:text-slate-200 ml-1">{filtered.length} / {suppliers.length}</span>
            </p>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Active</p>
               </div>
            </div>
          </div>
        </Card>

        {modal      && <SupplierModal initial={modal.mode==="edit" ? modal.data : undefined} onSave={handleSave} onClose={() => setModal(null)}/>}
        {delTarget  && <ConfirmDelete name={delTarget.name} onConfirm={handleDelete} onClose={() => setDelTarget(null)}/>}
        
        {viewTarget && (
          <SupplierDetailsModal 
            supplier={viewTarget} 
            onClose={() => setViewTarget(null)} 
            onCreateOrder={() => setPoTarget(viewTarget)}
            onReceive={(p) => setReceiveTarget(p)}
            onUpdate={fetchInitialData}
          />
        )}

        {poTarget && (
          <PurchaseOrderModal 
            supplier={poTarget} 
            products={products} 
            categories={categories}
            units={units}
            onClose={() => setPoTarget(null)} 
            onSave={handleCreatePO}
            onQuickAddProduct={handleQuickProductAdd}
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
