import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { useNavigate, useLocation } from "react-router-dom"
import { 
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiGrid, FiList, 
  FiPackage, FiTag, FiDollarSign, FiX, FiActivity, FiShoppingCart, FiCheck, FiCreditCard, FiBox, FiHeart, FiPlusCircle, FiMinusCircle 
} from "react-icons/fi"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { ProductSkeleton } from "../components/Skeleton"

/* ─── Add to Cart Modal ─── */
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
            Add to Basket
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Product Card Component ─── */
function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate()
  const { authFetch } = useAuth()
  const queryClient = useQueryClient()
  const [activeImage, setActiveImage] = useState(0)
  const images = product.images?.length > 0 ? product.images : [{ url: null }]

  // Wishlist Check using React Query
  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => axios.get('/wishlist').then(res => res.data)
  })

  const inWishlist = wishlist.some(item => item.product_id === product.id)

  const wishlistMutation = useMutation({
    mutationFn: () => inWishlist 
      ? axios.delete(`/wishlist/${product.id}`)
      : axios.post(`/wishlist/${product.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] })
  })

  const toggleWishlist = (e) => {
    e.stopPropagation()
    wishlistMutation.mutate()
  }

  const nextImage = (e) => {
    e.stopPropagation()
    setActiveImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e) => {
    e.stopPropagation()
    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div 
      onClick={() => navigate(`/customer/products/${product.id}`)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full group cursor-pointer relative"
    >
      <div className="w-full h-56 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden group/img">
        {images[activeImage]?.url ? (
          <img src={images[activeImage].url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
             <FiBox className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
        )}

        {product.has_discount && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-rose-500/90 backdrop-blur text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm z-20">
            {product.discount_percent}% OFF
          </div>
        )}

        <button 
          onClick={toggleWishlist}
          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full shadow-sm z-20 hover:scale-110 transition-transform"
        >
          <FiHeart size={16} className={inWishlist ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
        </button>

        {product.stock <= 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-black/80 backdrop-blur text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg z-20">
            Sold Out
          </div>
        )}

        {images.length > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
              {images.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-4 bg-sky-400' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-900 dark:text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-md z-20 font-black text-sm">&lt;</button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-900 dark:text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-white hover:scale-110 shadow-md z-20 font-black text-sm">&gt;</button>
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
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black tracking-tighter ${product.has_discount ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                ${Number(product.sale_price || product.price).toFixed(2)}
              </span>
              {product.has_discount && (
                <span className="text-sm text-slate-400 line-through mb-1 font-bold">
                  ${Number(product.price).toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            disabled={product.stock <= 0}
            className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm
              ${product.stock > 0 ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"}`}
          >
            <FiShoppingCart size={16} /> {product.stock > 0 ? "Add to Cart" : "Out"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CustomerProducts() {
  const { authFetch } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const queryClient = useQueryClient()
  
  // React Query Fetching
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['storefront-products'],
    queryFn: () => axios.get('/products').then(res => res.data)
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => axios.get('/categories').then(res => res.data)
  })

  const loading = loadingProducts
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [cartTarget, setCartTarget] = useState(null)

  // Mutations
  const cartMutation = useMutation({
    mutationFn: ({ id, qty }) => axios.post(`/cart/${id}`, { quantity: qty }),
    onSuccess: () => {
      window.dispatchEvent(new Event("cart_updated"))
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast(`${cartTarget.name} added to cart!`)
      setCartTarget(null)
    },
    onError: (err) => toast(err.response?.data?.error || "Failed", "error")
  })

  // Handle URL Search Parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get("q") || ""
    const cat = params.get("cat") || "All"
    setSearchQuery(q)
    setSelectedCategory(cat)
  }, [location.search])

  const handleAddToCart = (qty) => {
    cartMutation.mutate({ id: cartTarget.id, qty })
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.company?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || String(product.category_id) === String(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen p-6 pb-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Our Products</h1>
            {searchQuery && <p className="text-sm text-sky-500 font-bold mt-1">Showing results for "{searchQuery}"</p>}
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold focus:outline-none focus:border-sky-500 transition-all appearance-none cursor-pointer shadow-sm">
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [...Array(8)].map((_, i) => <ProductSkeleton key={i} isInternal={false} />)
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-black/5 dark:border-white/5"><FiPackage className="w-16 h-16 text-slate-200 mx-auto mb-4"/><p className="text-lg font-black text-slate-800 dark:text-white">No products found</p></div>
          ) : (
            filteredProducts.map(product => <ProductCard key={product.id} product={product} onAddToCart={(p) => setCartTarget(p)} />)
          )}
        </div>
      </div>

      {cartTarget && (
        <AddToCartModal 
          product={cartTarget} 
          onClose={() => setCartTarget(null)} 
          onConfirm={handleAddToCart}
        />
      )}
    </div>
  )
}
