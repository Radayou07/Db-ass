import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { FiShoppingCart, FiTrash2, FiMinusCircle, FiPlusCircle, FiCheck, FiX, FiActivity, FiCreditCard, FiAlertCircle } from "react-icons/fi"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Skeleton } from "../components/Skeleton"

export default function Cart() {
  const { authFetch, resolveImageUrl } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // React Query Fetching
  const { data: cartItems = [], isLoading: loading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => axios.get('/cart').then(res => res.data)
  })

  const [couponCode, setCouponCode] = useState("")
  const [discountInfo, setDiscountInfo] = useState(null)
  const [couponError, setCouponError] = useState("")
  const [showQR, setShowQR] = useState(false)

  // Mutations
  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }) => axios.patch(`/cart/${id}`, { quantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      window.dispatchEvent(new Event('cart_updated'))
      setDiscountInfo(null)
    }
  })

  const removeMutation = useMutation({
    mutationFn: (id) => axios.delete(`/cart/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      window.dispatchEvent(new Event('cart_updated'))
      setDiscountInfo(null)
    }
  })

  const couponMutation = useMutation({
    mutationFn: (code) => axios.post('/discount/apply', { code }),
    onSuccess: (res) => {
      if (res.data.valid) {
        setDiscountInfo(res.data)
      } else {
        setDiscountInfo(null)
        setCouponError(res.data.message)
      }
    },
    onError: () => setCouponError("Network error checking coupon")
  })

  const orderMutation = useMutation({
    mutationFn: (payload) => axios.post('/orders', payload),
    onSuccess: (res, variables) => {
      toast(variables.paid ? "Order placed and paid successfully!" : "Order placed successfully!")
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      window.dispatchEvent(new Event('cart_updated'))
      navigate("/orders")
    },
    onError: (err) => toast(err.response?.data?.error || "Failed", "error")
  })

  const updateQuantity = (productId, newQty) => {
    updateQtyMutation.mutate({ id: productId, qty: newQty })
  }

  const removeItem = (productId) => {
    removeMutation.mutate(productId)
  }

  const applyCoupon = () => {
    if (!couponCode.trim()) return
    setCouponError("")
    couponMutation.mutate(couponCode)
  }

  const handleOrder = (isPaid = false) => {
    if (hasOutOfStockItems) {
      toast("Please remove out of stock items before checkout.", "error")
      return
    }
    orderMutation.mutate({
      paid: isPaid,
      discount_id: discountInfo?.discount_id,
      discount_amount: discountInfo?.coupon_savings
    })
  }

  const isApplying = couponMutation.isPending
  const placingOrder = orderMutation.isPending

  // Calculations
  const originalSubtotal = cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0)
  const productSubtotal = cartItems.reduce((sum, item) => sum + ((item.product?.sale_price || 0) * item.quantity), 0)
  const productSavings = originalSubtotal - productSubtotal
  
  const finalTotal = discountInfo ? discountInfo.final_total : productSubtotal
  
  const hasOutOfStockItems = cartItems.some(item => item.product.stock <= 0)

  if (loading) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
         <Skeleton className="h-12 w-64" />
         <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
               {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
            </div>
            <Skeleton className="w-full lg:w-[380px] h-[500px] rounded-[2.5rem]" />
         </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="h-[70vh] p-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700 shadow-inner">
          <FiShoppingCart size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Your cart is empty</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/customer/products" className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-sky-200 dark:shadow-none transition-all active:scale-95">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-6 mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-3">
          Shopping Cart 
          <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{cartItems.length}</span>
        </h1>
      </div>
      
      {hasOutOfStockItems && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 p-5 rounded-3xl flex items-center gap-4 text-rose-600 dark:text-rose-400 mb-8 animate-pulse">
           <FiAlertCircle size={24} className="shrink-0" />
           <p className="text-sm font-bold uppercase tracking-widest">Some items in your cart are out of stock. Please remove them to continue checkout.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Cart Items */}
        <div className="flex-1 flex flex-col gap-4">
          {cartItems.map((item) => (
            <div key={item.id} className={`flex flex-col sm:flex-row gap-6 p-4 sm:p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow-sm hover:shadow-md transition-all ${item.product.stock <= 0 ? 'border-rose-300 dark:border-rose-900/50 opacity-80' : 'border-black/5 dark:border-white/5'}`}>
              {/* Image */}
              <div className="w-full sm:w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative">
                {item.product.images?.[0] ? (
                  <img src={resolveImageUrl(item.product.images[0].url)} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <FiShoppingCart className="text-slate-300" size={32} />
                )}
                {item.product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] -rotate-12">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.product.category_name || "Misc"}</p>
                    <Link to={`/customer/products/${item.product.id}`} className="text-lg font-bold text-slate-800 dark:text-white hover:text-sky-500 transition-colors line-clamp-1">{item.product.name}</Link>
                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${item.product.stock <= 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {item.product.stock <= 0 ? 'Sold Out' : `Available: ${item.product.stock} ${item.product.uom_abbreviation}`}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-4 sm:mt-0">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[1.5rem] border border-black/5 dark:border-white/5">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-600 dark:text-white active:scale-90 transition-transform">
                      <FiMinusCircle size={16} />
                    </button>
                    <span className="font-black w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-600 dark:text-white active:scale-90 transition-transform" disabled={item.quantity >= item.product.stock}>
                      <FiPlusCircle size={16} />
                    </button>
                  </div>
                  
                  <div className="text-right flex flex-col items-end">
                    {item.product.has_discount && (
                      <span className="text-xs text-slate-400 font-bold line-through">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    )}
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                      ${(item.product.sale_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-xl sticky top-8">
            <h2 className="text-lg font-black uppercase tracking-tighter mb-6 text-slate-800 dark:text-white">Order Summary</h2>

            {/* Coupon Code */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter code..." 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-sky-500 outline-none text-sm font-bold shadow-inner"
                />
                <button 
                  onClick={applyCoupon}
                  disabled={isApplying || !couponCode.trim()}
                  className="px-5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isApplying ? "..." : "Apply"}
                </button>
              </div>
              {couponError && <p className="text-[10px] text-rose-500 font-bold px-1">{couponError}</p>}
              {discountInfo && <p className="text-[10px] text-emerald-500 font-bold px-1 flex items-center gap-1"><FiCheck /> {discountInfo.message}</p>}
            </div>

            {/* Totals */}
            <div className="space-y-3 py-4 border-t border-black/5 dark:border-white/5">
              <div className="flex justify-between text-sm font-bold text-slate-500">
                <span>Original Subtotal</span>
                <span>${originalSubtotal.toFixed(2)}</span>
              </div>
              
              {productSavings > 0 && (
                <div className="flex justify-between text-sm font-bold text-emerald-500">
                  <span>Product Savings</span>
                  <span>-${productSavings.toFixed(2)}</span>
                </div>
              )}
              
              {discountInfo && (
                <div className="flex justify-between text-sm font-bold text-emerald-500">
                  <span>Coupon Discount</span>
                  <span>-${discountInfo.coupon_savings.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="py-6 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${finalTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setShowQR(true)}
                disabled={placingOrder || hasOutOfStockItems}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <FiCreditCard size={16}/> Instant Checkout
              </button>
              <button 
                onClick={() => handleOrder(false)}
                disabled={placingOrder || hasOutOfStockItems}
                className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-black/5 dark:border-white/5 disabled:opacity-50"
              >
                Confirm Reservation
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
              <FiX size={20} />
            </button>
            
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white mb-2 mt-4">Scan to Pay</h3>
            <p className="text-sm font-bold text-sky-500 mb-6">${finalTotal.toFixed(2)}</p>
            
            <div className="w-48 h-48 mx-auto bg-white rounded-2xl mb-8 flex items-center justify-center overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg p-2">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAYMENT_DEMO_${finalTotal}`} alt="QR Code" className="w-full h-full mix-blend-multiply" />
            </div>
            
            <button 
              onClick={() => handleOrder(true)}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 transition-all active:scale-95"
            >
              Verify Payment
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
