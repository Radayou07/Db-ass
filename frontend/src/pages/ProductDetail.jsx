import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { 
  FiArrowLeft, FiPackage, FiTag, FiDollarSign, FiArchive, 
  FiActivity, FiCalendar, FiShoppingCart, FiCheck, 
  FiCreditCard, FiInfo, FiTruck, FiShield, FiRotateCcw,
  FiChevronLeft, FiChevronRight, FiPlusCircle, FiMinusCircle, FiX, FiTrash2
} from "react-icons/fi"

/* ─── Add to Cart Modal (Same as Products page for consistency) ─── */
function AddToCartModal({ product, onConfirm, onClose }) {
  const [qty, setQty] = useState(1)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 w-full max-w-sm rounded-[2.5rem] p-7 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-black flex items-center gap-2 uppercase tracking-widest text-sm text-slate-800 dark:text-white"><FiShoppingCart className="text-sky-500" /> Add to Cart</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 dark:bg-slate-800 rounded-xl"><FiX size={20} /></button>
        </div>

        <div className="flex gap-5 mb-8 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-black/5 dark:border-white/5">
          <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5 shadow-sm shrink-0">
             {product.images?.[0] ? <img src={product.images[0].url} className="w-full h-full object-cover"/> : <FiPackage className="text-slate-300" size={24}/>}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-slate-800 dark:text-white">{product.name}</p>
            <p className="text-sky-500 font-black text-lg mt-0.5">${Number(product.sale_price || product.price).toFixed(2)}</p>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Stock: {product.stock}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1 text-center">Select Quantity</label>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-inner">
               <button 
                 type="button" 
                 onClick={()=>setQty(Math.max(1, qty-1))} 
                 className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm border border-black/5 dark:border-white/5 active:scale-90"
               >
                  <FiMinusCircle className="text-slate-400" size={18}/>
               </button>
               
               <div className="flex flex-col items-center">
                  <input type="number" readOnly value={qty} className="w-16 text-center bg-transparent font-black text-2xl outline-none text-slate-800 dark:text-white" />
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{product.uom_abbreviation || 'Units'}</span>
               </div>

               <button 
                 type="button" 
                 onClick={()=>setQty(Math.min(product.stock, qty+1))} 
                 className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm border border-black/5 dark:border-white/5 active:scale-90"
               >
                  <FiPlusCircle className="text-sky-500" size={18}/>
               </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6 px-1">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Price</p>
             <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">${((product.sale_price || product.price) * qty).toFixed(2)}</p>
          </div>

          <button 
            onClick={() => onConfirm(qty)}
            className="w-full py-4 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-200 dark:shadow-none hover:bg-sky-600 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Confirm & Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, authFetch } = useAuth()
  const { toast } = useToast()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [showCartModal, setShowCartModal] = useState(false)
  
  const isInternal = user?.role === "admin" || user?.role === "staff"

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/products/${id}`)
      if (res.ok) {
        setProduct(await res.json())
      } else {
        setError("Target entity not found.")
      }
    } catch (err) {
      setError("System data synchronization failed.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (qty) => {
    try {
      const res = await authFetch(`/cart/${product.id}`, {
        method: "POST",
        body: JSON.stringify({ quantity: qty })
      })
      if (res.ok) {
        window.dispatchEvent(new Event("cart_updated"))
        toast(`${product.name} added to cart!`)
        setShowCartModal(false)
      } else {
        const err = await res.json()
        toast(err.error || "Failed to add to cart", "error")
      }
    } catch (err) {
      toast("Network error", "error")
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center bg-main-bg dark:bg-main-dark-bg">
        <FiActivity className="w-12 h-12 text-sky-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Entity Details...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center bg-main-bg dark:bg-main-dark-bg p-6">
        <FiPackage className="w-20 h-20 text-slate-200 dark:text-slate-600 mb-6" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{error || "Entity Missing"}</h2>
        <button 
          onClick={() => navigate(isInternal ? "/staff/products" : "/customer/products")}
          className="mt-8 px-8 py-3 rounded-2xl bg-sky-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-200 dark:shadow-none transition-all"
        >
          Return to Catalog
        </button>
      </div>
    )
  }

  const images = product.images?.length > 0 ? product.images : [{ url: null }]

  const nextImage = (e) => {
    if (e) e.stopPropagation()
    setActiveImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e) => {
    if (e) e.stopPropagation()
    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen bg-main-bg dark:bg-main-dark-bg p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-sky-500 transition-colors font-black uppercase tracking-widest text-[10px]"
          >
            <FiArrowLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ref: #{product.id.toString().padStart(5, '0')}</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] border border-box-border dark:border-box-dark-border shadow-sm overflow-hidden flex flex-col lg:flex-row">
          
          {/* Visual Panel */}
          <div className="lg:w-1/2 p-8 lg:p-12 space-y-6 bg-slate-50 dark:bg-slate-900/30 border-r border-slate-100 dark:border-slate-800">
             <div className="aspect-square w-full rounded-3xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 shadow-inner overflow-hidden flex items-center justify-center relative group/gallery">
                {images[activeImage]?.url ? (
                  <img src={images[activeImage].url} className="w-full h-full object-contain p-4 transition-all duration-700" alt={product.name} />
                ) : (
                  <FiPackage size={120} className="text-slate-200 dark:text-slate-600" />
                )}

                {/* Arrow Navigation */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 shadow-2xl active:scale-90 z-20 font-black text-2xl"
                    >
                      &lt;
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white dark:hover:bg-slate-700 shadow-2xl active:scale-90 z-20 font-black text-2xl"
                    >
                      &gt;
                    </button>
                  </>
                )}

                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <span className="px-4 py-1.5 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-sky-200 dark:shadow-none">{product.category_name}</span>
                   {product.stock <= 0 ? (
                     <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-slate-200 dark:shadow-none animate-pulse">Out of Stock</span>
                   ) : product.stock <= 5 && (
                     <span className="px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-rose-200 dark:shadow-none animate-pulse">Low Stock</span>
                   )}
                </div>

                {/* Image Indicator Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/30 dark:bg-white/10 backdrop-blur-md rounded-full z-20 shadow-lg">
                    {images.map((_, idx) => (
                      <button 
                        key={idx} 
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImage(idx)
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${activeImage === idx ? 'w-6 bg-sky-400' : 'w-2 bg-white/60 hover:bg-white'}`}
                        title={`View image ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
             </div>
             
             {images.length > 1 && (
               <div className="grid grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImage(idx)}
                      className={`aspect-square rounded-2xl border-2 transition-all overflow-hidden ${activeImage === idx ? 'border-sky-500 scale-105 shadow-md shadow-sky-100 dark:shadow-none' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                       <img src={img.url} className="w-full h-full object-cover" />
                    </button>
                  ))}
               </div>
             )}
          </div>

          {/* Info Panel */}
          <div className="lg:w-1/2 p-8 lg:p-12 space-y-10 flex flex-col justify-center">
             <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white leading-tight tracking-tighter">{product.name}</h1>
                <p className="text-sm font-bold text-sky-500 uppercase tracking-[0.2em] mt-2">{product.brand_name || product.company}</p>
             </div>

             <div className="space-y-4">
                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-medium">
                   {product.description || "No specific detailed description provided for this catalog entity. Please contact support or the manufacturer for additional specifications."}
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                   <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                      <FiArchive className="text-sky-500"/> {product.stock} {product.uom_abbreviation} Available
                   </div>
                   {product.expire && (
                     <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/20 px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400">
                        <FiCalendar/> Exp: {new Date(product.expire).toLocaleDateString()}
                     </div>
                   )}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Market Price</p>
                   <p className="text-5xl font-black text-slate-900 dark:text-white flex items-start gap-1">
                      <span className="text-2xl mt-1.5 text-sky-500">$</span>{Number(product.sale_price || product.price).toFixed(2)}
                   </p>
                   {product.has_discount && (
                     <p className="text-xs text-slate-400 line-through font-bold mt-1">Was ${Number(product.price).toFixed(2)}</p>
                   )}
                </div>
                
                <div className="flex gap-3">
                   {!isInternal ? (
                     <button 
                       onClick={() => setShowCartModal(true)}
                       disabled={product.stock <= 0}
                       className={`flex-1 sm:flex-none px-10 py-5 rounded-[2rem] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all
                         ${product.stock > 0 
                           ? "bg-sky-500 hover:bg-sky-600 text-white shadow-2xl shadow-sky-200 dark:shadow-none active:scale-95" 
                           : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
                     >
                        <FiShoppingCart size={18} /> {product.stock > 0 ? "Buy Now" : "Out of Stock"}
                     </button>
                   ) : (
                     <button 
                       onClick={() => navigate(`/staff/products`, { state: { edit: product, returnTo: `/staff/products/${product.id}` } })}
                       className="flex-1 sm:flex-none px-10 py-5 rounded-[2rem] bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95"
                     >
                        Update Entity
                     </button>
                   )}
                </div>
             </div>

             {/* Features/Badges */}
             <div className="grid grid-cols-2 gap-4 pt-10">
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                   <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <FiPackage size={20}/>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white truncate">Catalog Entity</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified product specifications</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                   <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center shrink-0">
                      <FiShield size={20}/>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white truncate">Secured Entity</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Certified Warranty</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {showCartModal && (
        <AddToCartModal 
          product={product} 
          onClose={() => setShowCartModal(false)} 
          onConfirm={handleAddToCart}
        />
      )}
    </div>
  )
}
