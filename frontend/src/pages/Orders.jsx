import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import {
  FiSearch, FiTrash2, FiX, FiEye,
  FiShoppingBag, FiDollarSign, FiClock, FiCheckCircle,
  FiChevronUp, FiChevronDown, FiAlertTriangle, FiActivity, FiUser, FiCreditCard, FiCheck, FiSmartphone
} from "react-icons/fi"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Skeleton } from "../components/Skeleton"

// Fixed orderTotal to account for discount_amount
const orderTotal = o => {
  const subtotal = o.details?.reduce((s, d) => s + d.quantity * d.price, 0) || 0
  const discount = Number(o.discount_amount || 0)
  return Math.max(0, subtotal - discount)
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
          <FiChevronUp   size={10} className={active && sort.dir==="asc"  ? "text-sky-400" : "opacity-30"}/>
          <FiChevronDown size={10} className={active && sort.dir==="desc" ? "text-sky-400" : "opacity-30"}/>
        </span>
      </span>
    </th>
  )
}

/* ─── Payment QR Modal (For Customers) ─── */
function PaymentQRModal({ amount, orderId, onDone, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white dark:bg-box-dark-bg border border-black/[.06] w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-widest text-[10px]"><FiSmartphone className="text-sky-500"/> Digital Transfer</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 transition-colors"><FiX size={18} /></button>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-6 border border-black/5">
           <div className="aspect-square w-full bg-white rounded-xl flex items-center justify-center border-4 border-slate-100 p-2 shadow-inner overflow-hidden">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ORDER_${orderId}_PAYMENT_${amount}`} 
                alt="QR Code"
                className="w-full h-full mix-blend-multiply"
              />
           </div>
        </div>

        <div className="mb-8">
           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Payable Amount</p>
           <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">${Number(amount).toFixed(2)}</p>
        </div>

        <button 
          onClick={onDone}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <FiCheck size={18}/> Verify Payment
        </button>
      </div>
    </div>
  )
}

/* ─── Staff Payment Modal (For Internal) ─── */
function StaffPaymentModal({ order, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-box-bg dark:bg-box-dark-bg border border-black/[.1] w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-black/[.05] pb-3">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">Process POS Payment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
        </div>

        <div className="mb-6">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
           <p className="text-2xl font-black text-sky-500">${orderTotal(order).toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
           <button 
            onClick={() => onConfirm("Cash")}
            className="w-full py-3.5 rounded-2xl bg-transparent dark:bg-transparent/5 border border-black/5 dark:border-white/5 text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-transparent/10 transition-all flex items-center justify-center gap-2"
           >
             <FiDollarSign/> Collect Cash
           </button>
           <button 
            onClick={() => onConfirm("Credit card")}
            className="w-full py-3.5 rounded-2xl bg-transparent dark:bg-transparent/5 border border-black/5 dark:border-white/5 text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-transparent/10 transition-all flex items-center justify-center gap-2"
           >
             <FiCreditCard/> Charge Credit Card
           </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Detail modal ─── */
function OrderDetailModal({ order, onTogglePaid, onClose, isInternal }) {
  const { resolveImageUrl } = useAuth()
  const total = orderTotal(order)
  const subtotal = order.details?.reduce((s, d) => s + d.quantity * d.price, 0) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[.05] dark:border-white/[.06]">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">Order #{order.id}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{order.customer_name} · {order.date}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-transparent/5 transition-colors">
            <FiX size={18}/>
          </button>
        </div>

        {/* Items */}
        <div className="px-6 py-4 flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Items</p>
          <div className="rounded-xl overflow-hidden border border-black/[.05] dark:border-white/[.06] max-h-[300px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-transparent dark:bg-transparent/5 border-b border-black/[.05] dark:border-white/[.06]">
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.05] dark:divide-white/[.06]">
                {order.details?.map((d, i) => (
                  <tr key={i} className="hover:bg-black/[.01] dark:hover:bg-white/[.01]">
                    <td className="px-4 py-2">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 border border-black/5">
                             {d.image_url ? <img src={resolveImageUrl(d.image_url)} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-200"><FiShoppingBag size={14}/></div>}
                          </div>
                          <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{d.product_name}</span>
                       </div>
                    </td>
                    <td className="px-4 py-2 text-center text-slate-500">{d.quantity}</td>
                    <td className="px-4 py-2 text-right text-slate-500">${Number(d.price).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-slate-900 dark:text-white font-bold">${(d.quantity * d.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-black/[.02] dark:bg-white/[.02] rounded-b-2xl border-t border-black/[.05] dark:border-white/[.06] space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500">
             <p className="font-bold uppercase tracking-widest">Subtotal</p>
             <p className="font-bold">${subtotal.toFixed(2)}</p>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between items-center text-xs text-emerald-500">
               <p className="font-bold uppercase tracking-widest">Coupon Discount</p>
               <p className="font-bold">-${Number(order.discount_amount).toFixed(2)}</p>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">${total.toFixed(2)}</span>
          </div>
          
          <div className="pt-3 flex gap-2">
            {!order.payment_status && isInternal && (
              <button onClick={() => onTogglePaid(order)}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-black uppercase tracking-widest hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200 dark:shadow-none">
                Mark as Paid
              </button>
            )}
            {!order.payment_status && !isInternal && (
              <button onClick={() => onTogglePaid(order)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">
                Pay Now
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-transparent dark:bg-transparent/5 border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const { user, authFetch } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isInternal = user?.role === "admin" || user?.role === "staff"

  // React Query Fetching
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => axios.get('/orders').then(res => res.data)
  })

  const loading = loadingOrders
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState({ field: "date", dir: "desc" })

  const [viewOrder, setViewOrder] = useState(null)
  const [payTarget, setPayTarget] = useState(null)
  const [staffPayTarget, setStaffPayTarget] = useState(null)

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast("Order cancelled.")
    },
    onError: () => toast("Network error", "error")
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, method }) => axios.post(`/orders/${id}/pay`, { payment_method: method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast("Payment successful!")
      setPayTarget(null)
      setStaffPayTarget(null)
      setViewOrder(null)
    },
    onError: (err) => toast(err.response?.data?.error || "Payment failed", "error")
  })

  const deleteOrder = (id) => {
    if (!window.confirm("Cancel this order?")) return
    deleteMutation.mutate(id)
  }

  const processPayment = (orderId, method) => {
    paymentMutation.mutate({ id: orderId, method })
  }

  const paid = orders.filter(o => o.payment_status === 1)
  const pending = orders.filter(o => o.payment_status === 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders
      .filter(o => {
        const matchSearch = String(o.id).includes(q) || o.customer_name?.toLowerCase().includes(q) || o.date.includes(q)
        const matchFilter = filter === "all" ? true : filter === "paid" ? o.payment_status === 1 : o.payment_status === 0
        return matchSearch && matchFilter
      })
      .sort((a, b) => {
        if (sort.field === "total") return sort.dir === "asc" ? orderTotal(a) - orderTotal(b) : orderTotal(b) - orderTotal(a)
        if (sort.field === "customer") return sort.dir === "asc" ? (a.customer_name||"").localeCompare(b.customer_name||"") : (b.customer_name||"").localeCompare(a.customer_name||"")
        const va = a[sort.field], vb = b[sort.field]
        if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === "asc" ? va - vb : vb - va
      })
  }, [orders, search, filter, sort])

  function handleSort(f) {
    setSort(s => s.field === f ? { field:f, dir: s.dir==="asc" ? "desc" : "asc" } : { field:f, dir:"asc" })
  }

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6 bg-main-bg dark:bg-main-dark-bg transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{isInternal ? "Orders Overview" : "My Purchases"}</h1>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5 font-bold uppercase tracking-widest">{isInternal ? "Managing all system transactions" : "List of all your shopping history"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard icon={FiShoppingBag} label="Total Orders" value={orders.length} iconClass="text-sky-400 bg-sky-50 dark:bg-sky-950/40" cardClass="border-box-border bg-box-bg dark:bg-box-dark-bg shadow-sm"/>
        <StatCard icon={FiCheckCircle} label="Paid" value={paid.length} iconClass="text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" cardClass="border-box-border bg-box-bg dark:bg-box-dark-bg shadow-sm"/>
        <StatCard icon={FiClock} label="Pending" value={pending.length} iconClass="text-amber-400 bg-amber-50 dark:bg-amber-950/40" cardClass="border-box-border bg-box-bg dark:bg-box-dark-bg shadow-sm"/>
        <StatCard icon={FiDollarSign} label="Total Revenue" value={`$${orders.reduce((s, o) => s + orderTotal(o), 0).toFixed(2)}`} iconClass="text-rose-400 bg-rose-50 dark:bg-rose-950/40" cardClass="border-box-border bg-box-bg dark:bg-box-dark-bg shadow-sm"/>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-box-bg dark:bg-box-dark-bg border-box-border dark:border-box-dark-border">
        {/* Controls */}
        <div className="p-4 border-b border-black/[.04] dark:border-white/[.04] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64 group">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
            <input 
              type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-sky-500 transition-all shadow-inner"
            />
          </div>

          <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
             {["all", "paid", "pending"].map(f => (
               <button key={f} onClick={() => setFilter(f)} 
                 className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                            ${filter === f ? "bg-white dark:bg-slate-800 text-sky-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                 {f}
               </button>
             ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-box-bg dark:bg-box-dark-bg z-10">
              <tr className="border-b border-black/[.04] dark:border-white/[.04]">
                <SortTh label="ID" field="id" sort={sort} onSort={handleSort} className="pl-6"/>
                {isInternal && <SortTh label="Customer" field="customer" sort={sort}/>}
                <SortTh label="Date" field="date" sort={sort}/>
                <SortTh label="Status" field="payment_status" sort={sort}/>
                <SortTh label="Total Amount" field="total" sort={sort} className="text-right pr-10"/>
                <th className="px-6 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.02] dark:divide-white/[.02]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={isInternal ? 6 : 5} className="px-6 py-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[.02] transition-colors group">
                  <td className="px-6 py-4 font-black text-slate-400 text-xs">#{order.id}</td>
                  {isInternal && (
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 font-black text-[10px]">
                          {(order.customer_name || "??").substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{order.customer_name}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4 text-slate-500 text-xs font-bold">{order.date}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                                    ${order.payment_status ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>
                      {order.payment_status ? <FiCheckCircle size={12}/> : <FiClock size={12}/>}
                      {order.payment_status ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right pr-10 font-black text-slate-900 dark:text-white text-base">
                    ${orderTotal(order).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewOrder(order)} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all" title="View Details"><FiEye size={18}/></button>
                      {!order.payment_status && (
                        <button onClick={() => isInternal ? setStaffPayTarget(order) : setPayTarget(order)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all" title="Process Payment"><FiCreditCard size={18}/></button>
                      )}
                      {(!order.payment_status || isInternal) && (
                        <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all" title="Cancel Order"><FiTrash2 size={18}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <FiShoppingBag size={48} className="text-slate-100 dark:text-slate-800" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No transactions found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      {viewOrder && (
        <OrderDetailModal 
          order={viewOrder} 
          isInternal={isInternal}
          onTogglePaid={(o) => isInternal ? setStaffPayTarget(o) : setPayTarget(o)}
          onClose={() => setViewOrder(null)} 
        />
      )}

      {payTarget && (
        <PaymentQRModal 
          amount={orderTotal(payTarget)} 
          orderId={payTarget.id}
          onDone={() => processPayment(payTarget.id, "Transfer")}
          onClose={() => setPayTarget(null)}
        />
      )}

      {staffPayTarget && (
        <StaffPaymentModal 
          order={staffPayTarget}
          onConfirm={(method) => processPayment(staffPayTarget.id, method)}
          onClose={() => setStaffPayTarget(null)}
        />
      )}
    </div>
  )
}
