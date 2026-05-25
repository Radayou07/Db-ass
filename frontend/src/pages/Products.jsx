import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiGrid, FiList, 
  FiPackage, FiTag, FiDollarSign, FiArchive, FiX, FiActivity, FiCalendar, FiImage, FiPlusCircle, FiMinusCircle, FiUploadCloud, FiHome, FiFolder, FiShoppingCart, FiCheck, FiCreditCard 
} from "react-icons/fi"

/* ─── Product Card Component ─── */
function ProductCard({ product, onEdit, onDelete, onBuy, isInternal }) {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]

  return (
    <div className="bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-box-border dark:border-box-dark-border p-5 hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
      <div className="flex gap-5 flex-1">
        <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
          {primaryImage ? (
            <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <FiPackage className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">{product.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
            </div>
            
            {isInternal && (
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(product)} className="p-2 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => onDelete(product)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><FiTrash2 size={14} /></button>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider">
              <FiTag size={12} className="text-sky-500" />
              {product.category_name || "Misc"}
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-sm">
              <FiDollarSign size={14} className="text-emerald-500" />
              {Number(product.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isInternal ? (
          <button 
            onClick={() => onBuy(product)}
            disabled={product.stock <= 0}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all
              ${product.stock > 0 
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-200 dark:shadow-none" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
          >
            <FiShoppingCart size={14} />
            {product.stock > 0 ? "Place Order" : "Unavailable"}
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
              {product.stock ?? 0} {product.uom_abbreviation} ON HAND
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.company}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Payment QR Modal ─── */
function PaymentQRModal({ amount, onDone, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center text-slate-800 dark:text-white">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold flex items-center gap-2 uppercase tracking-widest text-xs"><FiCreditCard className="text-sky-500"/> Checkout</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><FiX size={20} /></button>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl mb-6 border border-black/5 dark:border-white/5">
           <div className="aspect-square w-full bg-white rounded-xl flex items-center justify-center border-4 border-slate-100 p-2 shadow-inner overflow-hidden">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAYMENT_FOR_${amount}`} 
                alt="QR Code"
                className="w-full h-full mix-blend-multiply"
              />
           </div>
        </div>

        <div className="mb-8">
           <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Amount Due</p>
           <p className="text-4xl font-black text-slate-900 dark:text-white">${Number(amount).toFixed(2)}</p>
        </div>

        <button 
          onClick={onDone}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <FiCheck size={18}/> Verify Payment
        </button>
        <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed px-4">Transaction will be processed instantly via secured gateway.</p>
      </div>
    </div>
  )
}

/* ─── Buy Modal ─── */
function BuyModal({ product, onConfirm, onClose }) {
  const [qty, setQty] = useState(1)
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOrderOnly = async () => {
    setLoading(true)
    await onConfirm(product.id, qty, false)
    setLoading(false)
  }

  const handleOrderAndPay = async () => {
    setLoading(true)
    await onConfirm(product.id, qty, true)
    setLoading(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-sm rounded-3xl p-7 shadow-2xl text-slate-800 dark:text-white">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm"><FiShoppingCart className="text-sky-500" /> Checkout</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><FiX size={22} /></button>
          </div>

          <div className="flex gap-5 mb-8 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5 shadow-sm shrink-0">
               {product.images?.[0] ? <img src={product.images[0].url} className="w-full h-full object-cover"/> : <FiPackage className="text-slate-300" size={32}/>}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base truncate">{product.name}</p>
              <p className="text-sky-500 font-black text-xl mt-1">${Number(product.price).toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full inline-block">Stock: {product.stock}</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Order Volume ({product.uom_abbreviation})</label>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-inner">
                 <button 
                   type="button" 
                   onClick={()=>setQty(Math.max(1, qty-1))} 
                   className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm border border-black/5 dark:border-white/5 active:scale-90"
                 >
                    <FiMinusCircle className="text-slate-400 group-hover:text-slate-600" size={20}/>
                 </button>
                 
                 <div className="flex flex-col items-center">
                    <input type="number" readOnly value={qty} className="w-20 text-center bg-transparent font-black text-3xl outline-none" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{product.uom_name || 'Units'}</span>
                 </div>

                 <button 
                   type="button" 
                   onClick={()=>setQty(Math.min(product.stock, qty+1))} 
                   className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm border border-black/5 dark:border-white/5 active:scale-90"
                 >
                    <FiPlusCircle className="text-sky-500" size={20}/>
                 </button>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6 px-1">
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Grand Total</p>
               <p className="text-3xl font-black text-slate-900 dark:text-white">${(product.price * qty).toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button 
                onClick={() => setShowQR(true)}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <FiCreditCard size={16}/> Instant Checkout
              </button>
              <button 
                onClick={handleOrderOnly}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-black/5 dark:border-white/5"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      </div>

      {showQR && (
        <PaymentQRModal 
          amount={product.price * qty} 
          onDone={handleOrderAndPay} 
          onClose={() => setShowQR(false)} 
        />
      )}
    </>
  )
}

export default function Products() {
  const { user, authFetch } = useAuth()
  
  // App States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [units, setUnits] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState("grid")

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [buyTarget, setBuyTarget] = useState(null)
  const [currentProduct, setCurrentProduct] = useState(null)
  
  // Input Form States
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", company: "", expire: "", category_id: "", uom_id: "", initial_quantity: 0, warehouse_id: "", images: [] 
  })

  const [newCategoryName, setNewCategoryName] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const isInternal = user?.role === "admin" || user?.role === "staff"

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes, unitsRes, warehousesRes] = await Promise.all([
        authFetch("/products"),
        authFetch("/categories"),
        authFetch("/units"),
        authFetch("/products/warehouses")
      ])
      if (productsRes.ok) setProducts(await productsRes.json())
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
      if (unitsRes.ok) setUnits(await unitsRes.json())
      if (warehousesRes.ok) setWarehouses(await warehousesRes.json())
    } catch (err) {
      setError("System data synchronization failed.")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.company?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || String(product.category_id) === String(selectedCategory)
    return matchesSearch && matchesCategory
  })

  // CRUD & Interaction logic
  const openAddModal = () => {
    setCurrentProduct(null)
    setFormData({ 
      name: "", description: "", price: "", company: "", expire: "", 
      category_id: categories[0]?.id || "", 
      uom_id: units[0]?.id || "",
      initial_quantity: 0, warehouse_id: warehouses[0]?.id || "", images: [] 
    })
    setIsFormModalOpen(true)
  }

  const openEditModal = (product) => {
    setCurrentProduct(product)
    setFormData({
      name: product.name, description: product.description || "", price: product.price, company: product.company || "",
      expire: product.expire ? product.expire.split('T')[0] : "", category_id: product.category_id || "",
      uom_id: product.uom_id || "",
      initial_quantity: product.stock || 0, warehouse_id: product.warehouse_id || warehouses[0]?.id || "",
      images: product.images?.length > 0 ? product.images.map(img => img.url) : []
    })
    setIsFormModalOpen(true)
  }

  const handleQuickCategoryAdd = async () => {
    if (!newCategoryName.trim()) return
    setIsAddingCategory(true)
    try {
      const response = await authFetch("/categories", { method: "POST", body: JSON.stringify({ name: newCategoryName.trim() }) })
      if (response.ok) {
        const newCat = await response.json()
        setCategories([...categories, newCat])
        setFormData({ ...formData, category_id: newCat.id })
        setNewCategoryName("")
      } else { alert("Category already exists or system error.") }
    } catch (err) { alert("Network error") }
    finally { setIsAddingCategory(false) }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const uploadFormData = new FormData()
    files.forEach(file => uploadFormData.append('images', file))
    setIsUploading(true)
    try {
      const response = await authFetch("/upload", { method: "POST", body: uploadFormData })
      if (response.ok) {
        const { urls } = await response.json()
        setFormData({ ...formData, images: [...formData.images, ...urls] })
      } else { alert("Image processor failed to respond.") }
    } catch (err) { alert("Network error during stream.") }
    finally { setIsUploading(false); e.target.value = null }
  }

  const removeImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const url = currentProduct ? `/products/${currentProduct.id}` : "/products"
    const method = currentProduct ? "PUT" : "POST"
    try {
      const response = await authFetch(url, { method, body: JSON.stringify(formData) })
      if (response.ok) { setIsFormModalOpen(false); fetchInitialData() }
      else { const errData = await response.json(); alert(errData.error || "Persistence error.") }
    } catch (err) { alert("Network failure.") }
  }

  const handleDeleteConfirm = async () => {
    try {
      const response = await authFetch(`/products/${currentProduct.id}`, { method: "DELETE" })
      if (response.ok) { setIsDeleteModalOpen(false); setProducts(products.filter(p => p.id !== currentProduct.id)) }
      else { alert("Security lock: Product tied to active ledger.") }
    } catch (err) { alert("Network error.") }
  }

  const handleBuy = async (productId, quantity, isPaid = false) => {
    try {
      const res = await authFetch("/orders", {
        method: "POST",
        body: JSON.stringify({ 
          items: [{ product_id: productId, quantity }],
          paid: isPaid
        })
      })
      if (res.ok) {
        alert(isPaid ? "Transaction confirmed. Items allocated." : "Order recorded. Awaiting payment terminal sync.")
        setBuyTarget(null)
        fetchInitialData() 
      } else {
        const err = await res.json()
        alert(err.error || "Transaction failure.")
      }
    } catch (err) { alert("Core network failure.") }
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg transition-colors duration-300">
      <div className="h-full p-6 flex flex-col gap-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-box-bg dark:bg-box-dark-bg p-5 rounded-3xl border border-box-border dark:border-box-dark-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
               {isInternal ? "Inventory Catalog" : "Product Storefront"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-widest">
               {isInternal ? "Warehouse Management Interface" : "Live Product Availability"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{user?.name || "Initializing..."}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-sky-500">{user?.role}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-black shadow-xl shadow-sky-200 dark:shadow-none uppercase text-lg border-2 border-white/20">
              {user?.name ? user.name.substring(0, 2) : "IC"}
            </div>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-xl group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={20} />
            <input type="text" placeholder="Search by name, description, or brand..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-5 py-4 rounded-2xl bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-sm" />
          </div>
          
          <div className="flex gap-3 items-center overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="pl-4 pr-10 py-4 rounded-2xl bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border text-slate-700 dark:text-slate-200 text-sm font-bold focus:outline-none focus:border-sky-500 transition-all appearance-none cursor-pointer shadow-sm">
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            
            <div className="flex rounded-2xl bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border p-1.5 shadow-sm">
              <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-sky-500 text-white shadow-md shadow-sky-200 dark:shadow-none" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}><FiList size={20} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-sky-500 text-white shadow-md shadow-sky-200 dark:shadow-none" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}><FiGrid size={20} /></button>
            </div>

            {isInternal && (
              <>
                <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm border border-black/5 dark:border-white/5"><FiFolder size={18} /><span className="hidden xl:inline">Categories</span></button>
                <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-sky-200 dark:shadow-none active:scale-95"><FiPlus size={18} /><span className="hidden xl:inline">New Product</span></button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic List */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center"><FiActivity className="w-12 h-12 text-sky-500 animate-spin mb-4" /><p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Catalog Synchronizing...</p></div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center bg-box-bg dark:bg-box-dark-bg rounded-[3rem] border-2 border-dashed border-box-border dark:border-box-dark-border py-20 px-10"><FiPackage className="w-24 h-24 text-slate-200 dark:text-slate-800 mb-6" /><p className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Zero matches detected</p><p className="text-sm text-slate-400 mt-2 font-medium">Try broadening your search criteria or register a new entity.</p></div>
          ) : (
            <div className={viewMode === "list" ? "space-y-4 pb-10" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10"}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onEdit={openEditModal} onDelete={(p)=>{setCurrentProduct(p); setIsDeleteModalOpen(true)}} onBuy={(p)=>setBuyTarget(p)} isInternal={isInternal} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL DIALOGS ─── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-3xl rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 max-h-[95vh] overflow-hidden relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-slate-800 dark:text-white"><FiPackage size={24} className="text-sky-500" /> {currentProduct ? "Update Entity" : "Catalog Enrollment"}</h2>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl bg-slate-50 dark:bg-slate-800"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-6 text-sm overflow-y-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Identity Profile *</label><input required type="text" placeholder="e.g. Mechanical Keyboard G-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 outline-none transition-all shadow-inner" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Description</label><textarea rows="3" placeholder="Core specifications and features..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 outline-none transition-all shadow-inner resize-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Price Unit *</label><div className="relative"><FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16}/><input required type="number" step="0.01" min="0" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 outline-none transition-all shadow-inner font-bold" /></div></div>
                    <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Manufacturer</label><input type="text" placeholder="Brand Name" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 outline-none transition-all shadow-inner font-bold" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Node Category *</label>
                      <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent outline-none focus:border-sky-500 shadow-inner font-bold">
                        <option value="" disabled>Pick Label</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                      <div className="mt-3 flex gap-2">
                        <input type="text" placeholder="Quick Add..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 px-3 py-2 text-[10px] bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 outline-none font-bold shadow-sm" />
                        <button type="button" onClick={handleQuickCategoryAdd} disabled={isAddingCategory || !newCategoryName.trim()} className="w-10 h-10 flex items-center justify-center bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50 active:scale-95"><FiPlus size={18}/></button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Quantification *</label>
                      <select required value={formData.uom_id} onChange={e => setFormData({...formData, uom_id: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent outline-none focus:border-sky-500 shadow-inner font-bold">
                        <option value="" disabled>Select Unit</option>
                        {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-sky-50/50 dark:bg-sky-950/20 border-2 border-sky-100/50 dark:border-sky-900/30">
                    <label className="block text-xs font-black text-sky-600 dark:text-sky-400 mb-4 flex items-center gap-2 uppercase tracking-widest"><FiArchive size={16}/> Seed Stock Logic</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] text-slate-400 font-black uppercase mb-2 px-1">Quantity</label><input type="number" min="0" value={formData.initial_quantity} onChange={e => setFormData({...formData, initial_quantity: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-400 outline-none shadow-sm font-black text-base text-center" /></div>
                      <div><label className="block text-[10px] text-slate-400 font-black uppercase mb-2 px-1">Warehouse</label><select value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-transparent outline-none focus:border-sky-400 shadow-sm font-bold text-xs">{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1"><FiImage className="text-sky-400" /> Visual Assets</label>
                    <div className="space-y-4">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all relative overflow-hidden group shadow-inner">
                         {isUploading ? (
                           <div className="text-center space-y-2"><FiActivity className="animate-spin text-sky-500 mx-auto" size={32} /><p className="text-[10px] font-black uppercase text-sky-500 tracking-widest">Streaming...</p></div>
                         ) : (
                           <div className="text-center space-y-1"><FiUploadCloud className="text-slate-300 dark:text-slate-700 group-hover:text-sky-500 transition-colors mx-auto" size={40} /><p className="text-[10px] font-black uppercase text-slate-400 group-hover:text-slate-600 transition-colors tracking-widest">Upload Frame</p></div>
                         )}
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-3 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                          {formData.images.map((url, index) => (
                            <div key={index} className="group relative aspect-square rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-md"><img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" /><button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"><FiX size={12} /></button></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-8 py-3.5 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Cancel</button>
                <button type="submit" className="px-10 py-3.5 text-xs font-black rounded-2xl text-white bg-sky-500 hover:bg-sky-600 shadow-xl shadow-sky-200 dark:shadow-none uppercase tracking-[0.2em] transition-all active:scale-95">Commit Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 text-slate-800 dark:text-white max-h-[80vh]">
            <div className="flex items-center justify-between pb-2">
               <h2 className="text-lg font-black flex items-center gap-3 uppercase tracking-tighter"><FiFolder className="text-sky-400" /> Label Manager</h2>
               <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"><FiX size={20} /></button>
            </div>
            <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner">
                 <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 px-1">New Entry</label>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Category Name..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 px-4 py-3 text-sm bg-white dark:bg-slate-950 rounded-2xl border border-transparent focus:border-sky-500 outline-none font-bold shadow-sm" />
                    <button onClick={handleQuickCategoryAdd} disabled={isAddingCategory || !newCategoryName.trim()} className="px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50 active:scale-95">{isAddingCategory ? "..." : <FiPlus size={20}/>}</button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 px-1">System Labels ({categories.length})</label>
                 <div className="grid grid-cols-1 gap-2.5">
                    {categories.map(cat => (
                       <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-sky-500/50 transition-all">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                          <FiTag className="text-slate-300 group-hover:text-sky-500 transition-colors" size={16} />
                       </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="pt-2"><button onClick={() => setIsCategoryModalOpen(false)} className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-black/5 dark:border-white/5">Exit Manager</button></div>
          </div>
        </div>
      )}

      {buyTarget && <BuyModal product={buyTarget} onConfirm={handleBuy} onClose={() => setBuyTarget(null)} />}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-slate-800 dark:text-white text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-100 dark:shadow-none border border-rose-100 dark:border-rose-900/30"><FiTrash2 size={32} /></div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Drop Entity?</h3>
            <p className="text-xs text-slate-400 font-medium px-4 mb-8 leading-relaxed">Are you certain you want to purge <strong className="text-slate-800 dark:text-slate-200 font-black">"{currentProduct?.name}"</strong> from the master catalog? This action is irreversible.</p>
            <div className="flex gap-3 justify-center"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Abort</button><button onClick={handleDeleteConfirm} className="flex-1 py-4 rounded-2xl text-xs font-black text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200 dark:shadow-none uppercase tracking-widest transition-all active:scale-95">Purge Record</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
