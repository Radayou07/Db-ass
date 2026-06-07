import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiGrid, FiList, 
  FiPackage, FiTag, FiDollarSign, FiArchive, FiX, FiActivity, FiCalendar, FiImage, FiPlusCircle, FiMinusCircle, FiUploadCloud, FiHome, FiFolder, FiShoppingCart, FiCheck, FiCreditCard, FiShield, FiBox
} from "react-icons/fi"
import { ProductSkeleton } from "../components/Skeleton"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

/* ─── Product Card Component ─── */
function ProductCard({ product, onEdit, onDelete, onBuy, isInternal }) {
  const { resolveImageUrl } = useAuth()
  const navigate = useNavigate()
  const [activeImage, setActiveImage] = useState(0)
  const images = product.images?.length > 0 ? product.images : [{ url: null }]
  const detailPath = isInternal ? `/staff/products/${product.id}` : `/customer/products/${product.id}`

  const nextImage = (e) => {
    e.stopPropagation()
    setActiveImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e) => {
    e.stopPropagation()
    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
  }

  // If internal, render a compact horizontal card (admin style)
  // If customer, render a large vertical e-commerce style card
  if (isInternal) {
    return (
      <div 
        onClick={() => navigate(detailPath)}
        className="bg-box-bg dark:bg-box-dark-bg rounded-xl border border-box-border dark:border-box-dark-border p-3 hover:shadow-md transition-all duration-300 flex flex-col h-full group cursor-pointer active:scale-95"
      >
        <div className="flex gap-3 flex-1">
          <div className="w-20 h-20 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-black/5 dark:border-white/5 relative group/img">
            {images[activeImage]?.url ? (
              <img src={resolveImageUrl(images[activeImage].url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <FiPackage className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            )}

            {/* Mini Switcher Indicators */}
            {images.length > 1 && (
              <>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                  {images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-3 bg-sky-400' : 'w-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-white truncate text-sm">{product.name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 truncate">{product.description || "No description"}</p>
              </div>
              
              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => onEdit(product)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-300 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors"><FiEdit2 size={12} /></button>
                <button onClick={() => onDelete(product)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><FiTrash2 size={12} /></button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">
                <FiTag size={10} className="text-sky-500" />
                {product.category_name || "Misc"}
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-white">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between w-full">
            <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
              {product.stock ?? 0} {product.uom_abbreviation} {product.warehouse_name ? `(${product.warehouse_name})` : ""}
            </span>
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{product.company}</span>
          </div>
        </div>
      </div>
    )
  }

  // E-commerce Customer Card Layout
  return (
    <div 
      onClick={() => navigate(detailPath)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full group cursor-pointer relative"
    >
      {/* Huge Image Area */}
      <div className="w-full h-56 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden group/img">
        {images[activeImage]?.url ? (
          <img src={resolveImageUrl(images[activeImage].url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <FiBox className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
        )}

        {/* Out of stock badge */}
        {product.stock <= 0 && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
            Sold Out
          </div>
        )}

        {/* Mini Switcher Indicators */}
        {images.length > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-4 bg-sky-400' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
            
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-900 dark:text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-md z-20 font-black text-sm"
            >
              &lt;
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-900 dark:text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-md z-20 font-black text-sm"
            >
              &gt;
            </button>
          </>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category_name || "Misc"}</p>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{product.company}</p>
        </div>
        
        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1 leading-tight group-hover:text-sky-500 transition-colors line-clamp-2">{product.name}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{product.description || "Premium quality product."}</p>
        
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onBuy(product); }}
            disabled={product.stock <= 0}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg
              ${product.stock > 0 
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200 dark:shadow-none hover:-translate-y-1" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"}`}
          >
            <FiShoppingCart size={20} />
          </button>
        </div>
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
  const { resolveImageUrl } = useAuth()
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
               {product.images?.[0] ? <img src={resolveImageUrl(product.images[0].url)} className="w-full h-full object-cover"/> : <FiPackage className="text-slate-300" size={32}/>}
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
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
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
  const { user, authFetch, resolveImageUrl } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // React Query Fetching
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/products').then(res => res.data)
  })
  
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => axios.get('/categories').then(res => res.data)
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => axios.get('/brands').then(res => res.data)
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => axios.get('/units').then(res => res.data)
  })

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => axios.get('/inventory/warehouses').then(res => res.data)
  })

  const loading = loadingProducts
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
  const [editReturnTo, setEditReturnTo] = useState(null)
  
  // Input Form States
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", brand_id: "", expire: "", category_id: "", uom_id: "", initial_quantity: 0, warehouse_id: "", discount_percent: 0, discount_expires_at: "", existing_stock: 0, images: [],
    buy_cost: "", markup_percent: "", profit_amount: ""
  })

  const [newCategoryName, setNewCategoryName] = useState("")
  const [quickCategoryName, setQuickCategoryName] = useState("")
  const [quickCategoryError, setQuickCategoryError] = useState("")
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isQuickAddingCategory, setIsQuickAddingCategory] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // ─── Derived State ───
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === "All" || String(p.category_id) === String(selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const openAddModal = () => {
    setCurrentProduct(null);
    setFormData({
      name: "", description: "", price: "", brand_id: "", expire: "", category_id: "", uom_id: "", initial_quantity: 0, warehouse_id: "", discount_percent: 0, discount_expires_at: "", existing_stock: 0, images: [],
      buy_cost: "", markup_percent: "", profit_amount: ""
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (product, returnTo = null) => {
    setCurrentProduct(product);
    setEditReturnTo(returnTo);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      brand_id: product.brand_id,
      expire: product.expire || "",
      category_id: product.category_id,
      uom_id: product.uom_id,
      existing_stock: product.stock,
      warehouse_id: product.warehouse_id || "",
      discount_percent: product.discount_percent || 0,
      discount_expires_at: product.discount_expires_at || "",
      images: product.images?.map(img => img.url) || [],
      buy_cost: product.source_unit_price || "",
      markup_percent: "",
      profit_amount: ""
    });
    setIsFormModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const uploadFormData = new FormData();
    files.forEach(file => uploadFormData.append('images', file));

    setIsUploading(true);
    try {
      const response = await authFetch("/upload", { method: "POST", body: uploadFormData });
      if (response.ok) {
        const { urls } = await response.json();
        setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const removeImage = (idx) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const updateBuyCost = (value) => {
    const cost = Number(value) || 0
    setFormData(prev => ({ ...prev, buy_cost: value, price: cost > 0 ? (cost * 1.3).toFixed(2) : prev.price }))
  }

  const applyMarkup = (markup) => {
    const cost = Number(formData.buy_cost) || 0
    if (cost > 0) setFormData(prev => ({ ...prev, price: (cost * markup).toFixed(2) }))
  }

  const applyMarkupPercent = (value) => {
    const cost = Number(formData.buy_cost) || 0
    const percent = Number(value) || 0
    setFormData(prev => ({
      ...prev,
      markup_percent: value,
      price: cost > 0 ? (cost * (1 + percent / 100)).toFixed(2) : prev.price
    }))
  }

  const applyProfitAmount = (value) => {
    const cost = Number(formData.buy_cost) || 0
    const profit = Number(value) || 0
    setFormData(prev => ({
      ...prev,
      profit_amount: value,
      price: cost > 0 ? (cost + profit).toFixed(2) : prev.price
    }))
  }

  const isInternal = user?.role === "admin" || user?.role === "staff"

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: ({ url, method, payload }) => axios({ url, method, data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsFormModalOpen(false)
      toast(currentProduct ? "Product record updated" : "Product catalog entry created")
      if (currentProduct && editReturnTo) {
        navigate(editReturnTo, { replace: true })
      }
    },
    onError: (err) => {
      toast(err.response?.data?.error || "Operation failed", "error")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsDeleteModalOpen(false)
      toast("Product successfully purged from system")
    },
    onError: () => toast("Cannot delete product with history", "error")
  })

  const quickCategoryMutation = useMutation({
    mutationFn: (name) => axios.post('/categories', { name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setFormData(prev => ({ ...prev, category_id: res.data.id }))
      setNewCategoryName("")
      setQuickCategoryName("")
      toast("Category added")
    },
    onError: (err) => {
      toast(err.response?.data?.error || "Failed", "error")
    }
  })

  const orderMutation = useMutation({
    mutationFn: (payload) => axios.post('/orders', payload),
    onSuccess: (res, variables) => {
      toast(variables.paid ? "Transaction finalized!" : "Order reserved!")
      setBuyTarget(null)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err) => toast(err.response?.data?.error || "Failed", "error")
  })

  const handleQuickCategoryAdd = async (event) => {
    event?.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return
    quickCategoryMutation.mutate(name)
  }

  const handleProductQuickCategoryAdd = async (event) => {
    event?.preventDefault()
    const name = quickCategoryName.trim()
    if (!name) return
    quickCategoryMutation.mutate(name)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const url = currentProduct ? `/products/${currentProduct.id}` : "/products"
    const method = currentProduct ? "PUT" : "POST"
    const payload = { ...formData }
    if (currentProduct) delete payload.initial_quantity
    
    upsertMutation.mutate({ url, method, payload })
  }

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(currentProduct.id)
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Purge this category?")) return
    try {
      const res = await axios.delete(`/categories/${id}`)
      if (res.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        toast("Category removed")
      }
    } catch (err) { toast("Failed", "error") }
  }

  const handleBuy = async (productId, quantity, isPaid = false) => {
    orderMutation.mutate({ items: [{ product_id: productId, quantity }], paid: isPaid })
  }

  useEffect(() => {
    const editProduct = location.state?.edit
    if (loading) return

    if (editProduct) {
      openEditModal(editProduct, location.state?.returnTo || null)
      navigate(location.pathname, { replace: true, state: null })
      return
    }
  }, [location.state, loading])

  // Removed old fetch logic and redundant effects
  /*
  const fetchInitialData = async () => {
    ...
  }

  useEffect(() => {
    fetchInitialData()
  }, [])
  */

  const selectedFormUnit = units.find(unit => String(unit.id) === String(formData.uom_id))
  const formUnitLabel = selectedFormUnit?.abbreviation || selectedFormUnit?.name || "unit"
  const formQuantity = Number(formData.initial_quantity) || 0
  const formSellPrice = Number(formData.price) || 0
  const formBuyCost = Number(formData.buy_cost) || 0
  const formExistingStock = Number(formData.existing_stock) || 0
  const formSellTotal = formQuantity * formSellPrice
  const formBuyTotal = formQuantity * formBuyCost
  const formProfitPerUnit = formSellPrice - formBuyCost
  const formProfitTotal = formSellTotal - formBuyTotal
  const formProfitIsNegative = formProfitTotal < 0

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg transition-colors duration-300">
      <div className="h-full p-6 flex flex-col gap-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-box-bg dark:bg-box-dark-bg p-5 rounded-3xl border border-box-border dark:border-box-dark-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
               {isInternal ? "Shop Inventory" : "Start Shopping"}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 font-semibold uppercase tracking-widest">
               {isInternal ? "Manage your store products" : "Browse what's in store"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-100 leading-tight">{user?.name || "Loading..."}</p>
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
            <input type="text" placeholder="Search by name, description, or brand..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-5 py-4 rounded-2xl bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-sm" />
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
                <button onClick={() => openAddModal()} className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-sky-200 dark:shadow-none active:scale-95"><FiPlus size={18} /><span className="hidden xl:inline">Add Product</span></button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic List */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1 custom-scrollbar">
          {loading ? (
            <div className={viewMode === "list" ? "space-y-4 pb-10" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10"}>
              {[...Array(8)].map((_, i) => <ProductSkeleton key={i} isInternal={isInternal} />)}
            </div>
          ) : filteredProducts.length === 0 ? (            <div className="flex flex-col items-center justify-center h-full text-center bg-box-bg dark:bg-box-dark-bg rounded-[3rem] border-2 border-dashed border-box-border dark:border-box-dark-border py-20 px-10"><FiPackage className="w-24 h-24 text-slate-200 dark:text-slate-600 mb-6" /><p className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">No products found</p><p className="text-sm text-slate-400 dark:text-slate-300 mt-2 font-medium">Try searching for something else or add a new product.</p></div>
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-none">
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-box-bg dark:bg-box-dark-bg rounded-[1.75rem] shadow-2xl border border-box-border dark:border-box-dark-border overflow-hidden flex flex-col pointer-events-auto">
            <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{currentProduct ? "Modify Product" : "Add Product"}</h3>
                <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mt-1">Catalog Management</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="p-2.5 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><FiX size={22}/></button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 min-h-0 overflow-hidden p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                
                {/* 1. Basics */}
                <section className="rounded-[1.25rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-3">
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Product Basics</h4>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Product Name *</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Description</label>
                      <textarea rows="1" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner resize-none text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Brand *</label>
                        <select required value={formData.brand_id} onChange={e => setFormData({...formData, brand_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                          <option value="" disabled>Select Brand</option>
                          {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Category *</label>
                        <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                          <option value="" disabled>Select Category</option>
                          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
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
                                if (event.key === "Enter") handleProductQuickCategoryAdd(event)
                              }}
                              className="min-w-0 flex-1 px-2 py-1.5 text-[10px] bg-transparent outline-none font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-400"
                            />
                            <button type="button" onClick={handleProductQuickCategoryAdd} disabled={isQuickAddingCategory || !quickCategoryName.trim()} className="w-8 h-8 flex items-center justify-center bg-sky-500 text-white rounded-lg shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50 active:scale-95">
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
                      <select required value={formData.uom_id} onChange={e => setFormData({...formData, uom_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                        <option value="" disabled>Select Unit</option>
                        {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.abbreviation})</option>)}
                      </select>
                    </div>
                  </div>
                </section>

                {/* 2. Pricing */}
                <section className="rounded-[1.25rem] border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-3">
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Pricing & Margins</h4>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5">
                        <label className="block text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 px-1">Buy Cost / {formUnitLabel} *</label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14}/>
                          <input required type="number" min="0" step="0.01" value={formData.buy_cost} onChange={event => updateBuyCost(event.target.value)} className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 focus:border-emerald-500 outline-none shadow-inner font-black text-sm text-emerald-700 dark:text-emerald-300" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 p-2.5">
                        <label className="block text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1 px-1">Sell Price / {formUnitLabel} *</label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" size={14}/>
                          <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-sky-900/40 focus:border-sky-500 outline-none shadow-inner font-black text-sm text-sky-700 dark:text-sky-300" />
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
                        <input type="number" min="0" step="0.01" placeholder="35" value={formData.markup_percent} onChange={event => applyMarkupPercent(event.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Profit $</label>
                        <div className="relative">
                          <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={13}/>
                          <input type="number" min="0" step="0.01" placeholder="5.00" value={formData.profit_amount} onChange={event => applyProfitAmount(event.target.value)} className="w-full pl-8 pr-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-100 dark:border-emerald-900/20">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Discount %</label>
                        <input type="number" step="0.01" min="0" max="100" placeholder="0" value={formData.discount_percent} onChange={e => setFormData({...formData, discount_percent: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Disc. Expire</label>
                        <input type="date" value={formData.discount_expires_at} onChange={e => setFormData({...formData, discount_expires_at: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                      </div>
                    </div>

                    <div className={`rounded-xl border px-3 py-2 ${formProfitIsNegative ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40" : "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-[7px] font-black uppercase tracking-[0.18em] ${formProfitIsNegative ? "text-rose-600" : "text-violet-600"}`}>Profit / {formUnitLabel}</p>
                          <p className={`text-base font-black ${formProfitIsNegative ? "text-rose-700 dark:text-rose-300" : "text-violet-700 dark:text-violet-300"}`}>${formProfitPerUnit.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-[7px] font-black uppercase tracking-[0.18em] ${formProfitIsNegative ? "text-rose-600" : "text-violet-600"}`}>Batch Gain</p>
                          <p className={`text-xl font-black ${formProfitIsNegative ? "text-rose-700 dark:text-rose-300" : "text-violet-700 dark:text-violet-300"}`}>${formProfitTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Stock & Photos */}
                <section className="rounded-[1.25rem] border border-sky-100 dark:border-sky-900/40 bg-sky-50/40 dark:bg-sky-950/10 p-3">
                  <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3">Stock & Photos</h4>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{currentProduct ? "Current Stock (Read Only)" : "Initial Qty"}</label>
                        <input 
                          type="number" 
                          readOnly={!!currentProduct}
                          value={formData.initial_quantity} 
                          onChange={!currentProduct ? e => setFormData({ ...formData, initial_quantity: e.target.value }) : undefined} 
                          className={`w-full px-3 py-2 rounded-xl border border-transparent outline-none shadow-inner font-bold text-sm ${currentProduct ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-white dark:bg-slate-900 focus:border-sky-500"}`} 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Expire</label>
                        <input type="date" value={formData.expire} onChange={e => setFormData({...formData, expire: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Warehouse</label>
                      <select value={formData.warehouse_id} onChange={e => setFormData({ ...formData, warehouse_id: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-transparent focus:border-sky-500 outline-none shadow-inner font-bold text-sm">
                        <option value="">Select Warehouse</option>
                        {warehouses.map(warehouse => <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.location})</option>)}
                      </select>
                    </div>
                    <label className={`h-16 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all shadow-inner ${isUploading ? "border-sky-400 bg-sky-50 dark:bg-sky-950/20" : "border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20"}`}>
                      {isUploading ? <FiActivity className="animate-spin text-sky-500" size={18}/> : <FiUploadCloud className="text-slate-300 dark:text-slate-600" size={20}/>}
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isUploading ? "Uploading..." : "Upload Photos"}</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <div className="min-h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2">
                      {formData.images.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">No photos</div>
                      ) : (
                        <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                          {formData.images.map((url, index) => (
                            <div key={url + index} className="relative aspect-square rounded-xl overflow-hidden border border-black/5 dark:border-white/10 group">
                              <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />
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
                  <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-all">Cancel</button>
                  <button type="submit" disabled={loading} className="px-8 py-2.5 text-xs font-black rounded-2xl text-white bg-sky-500 hover:bg-sky-600 shadow-xl shadow-sky-200 dark:shadow-none uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-60">
                    {currentProduct ? "Save Changes" : "Save Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6 text-slate-800 dark:text-white max-h-[80vh]">
            <div className="flex items-center justify-between pb-2">
               <h2 className="text-lg font-black flex items-center gap-3 uppercase tracking-tighter"><FiFolder className="text-sky-400" /> Manage Categories</h2>
               <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"><FiX size={20} /></button>
            </div>
            <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-black/5 dark:border-white/5 shadow-inner">
                 <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 px-1">New Category</label>
                 <div className="flex gap-2">
                    <input type="text" placeholder="Category Name..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-1 px-4 py-3 text-sm bg-white dark:bg-slate-950 rounded-2xl border border-transparent focus:border-sky-500 outline-none font-bold shadow-sm" />
                    <button type="button" onClick={handleQuickCategoryAdd} disabled={isAddingCategory || !newCategoryName.trim()} className="px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-50 active:scale-95">{isAddingCategory ? "..." : <FiPlus size={20}/>}</button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <label className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 px-1">All Categories ({categories.length})</label>
                 <div className="grid grid-cols-1 gap-2.5">
                    {categories.map(cat => (
                       <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-sky-500/50 transition-all">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                          <button 
                             onClick={() => handleDeleteCategory(cat.id)}
                             title="Remove Category"
                             className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100"
                          >
                             <FiTrash2 size={16} />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="pt-2"><button onClick={() => setIsCategoryModalOpen(false)} className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-black/5 dark:border-white/5">Close</button></div>
          </div>
        </div>
      )}

      {buyTarget && <BuyModal product={buyTarget} onConfirm={handleBuy} onClose={() => setBuyTarget(null)} />}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-slate-800 dark:text-white text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-100 dark:shadow-none border border-rose-100 dark:border-rose-900/30"><FiTrash2 size={32} /></div>
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Delete Product?</h3>
            <p className="text-xs text-slate-400 font-medium px-4 mb-8 leading-relaxed">Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200 font-black">"{currentProduct?.name}"</strong>? This cannot be undone.</p>
            <div className="flex gap-3 justify-center"><button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">Cancel</button><button onClick={handleDeleteConfirm} className="flex-1 py-4 rounded-2xl text-xs font-black text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200 dark:shadow-none uppercase tracking-widest transition-all active:scale-95">Confirm Delete</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
