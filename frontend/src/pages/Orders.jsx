import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import {
  FiSearch, FiTrash2, FiX, FiEye,
  FiShoppingBag, FiDollarSign, FiClock, FiCheckCircle,
  FiChevronUp, FiChevronDown, FiAlertTriangle, FiActivity, FiUser, FiCreditCard, FiCheck, FiSmartphone
} from "react-icons/fi"

const orderTotal = o => o.details?.reduce((s, d) => s + d.quantity * d.price, 0) || 0

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
      <div className="bg-transparent dark:bg-box-dark-bg border border-black/[.06] w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><FiSmartphone className="text-sky-500"/> Digital Transfer</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
        </div>
        
        <div className="bg-transparent dark:bg-transparent/5 p-6 rounded-2xl mb-6">
           <div className="aspect-square w-full bg-transparent rounded-lg flex items-center justify-center border-4 border-slate-100 p-2 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ORDER_${orderId}_PAYMENT_${amount}`} 
                alt="QR Code"
                className="w-full h-full"
              />
           </div>
        </div>

        <div className="mb-8">
           <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Payable via App</p>
           <p className="text-3xl font-black text-slate-900 dark:text-white">${Number(amount).toFixed(2)}</p>
        </div>

        <button 
          onClick={onDone}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <FiCheck size={18}/> Confirm Payment
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
  const total = orderTotal(order)
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
          <div className="rounded-xl overflow-hidden border border-black/[.05] dark:border-white/[.06]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-transparent dark:bg-transparent/5 border-b border-black/[.05] dark:border-white/[.06]">
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.04] dark:divide-white/[.04]">
                {order.details?.map(d => (
                  <tr key={d.id}>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">Product #{d.product_id}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{d.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">${d.price.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">${(d.quantity * d.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              order.payment_status
                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                : "bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400"
            }`}>
              {order.payment_status ? "Paid" : "Unpaid"}
            </span>
            {isInternal && (
              <button onClick={() => onTogglePaid(order)}
                className="text-xs text-sky-500 hover:underline transition-colors">
                Mark as {order.payment_status ? "unpaid" : "paid"}
              </button>
            )}
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-white">
            Total: <span className="text-sky-500">${total.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({ name, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-sm bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl
                      border border-black/[.06] dark:border-white/[.08] p-6 flex flex-col items-center gap-4 text-center">
        <span className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
          <FiAlertTriangle size={22} className="text-red-500"/>
        </span>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Delete Order</h3>
          <p className="text-sm text-slate-400 mt-1">Delete <span className="font-medium text-slate-600 dark:text-slate-300">{name}</span>? This cannot be undone.</p>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-transparent/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function Orders() {
  const { authFetch, user } = useAuth()
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [filter,    setFilter]    = useState("all") 
  const [sort,      setSort]      = useState({ field:"date", dir:"desc" })
  const [viewOrder, setViewOrder] = useState(null)
  const [payTarget, setPayTarget] = useState(null)
  const [staffPayTarget, setStaffPayTarget] = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  const isInternal = user?.role === "admin" || user?.role === "staff"
  const isCustomer = user?.role === "customer"

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await authFetch("/orders")
      if (res.ok) setOrders(await res.json())
    } catch (err) {
      console.error("Fetch orders failed", err)
    } finally {
      setLoading(false)
    }
  }

  const paid     = orders.filter(o => o.payment_status === 1)
  const unpaid   = orders.filter(o => o.payment_status === 0)
  const revenue  = paid.reduce((s, o) => s + orderTotal(o), 0)

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

  const processPayment = async (orderId, method) => {
    try {
      const res = await authFetch(`/orders/${orderId}/pay`, { 
        method: "POST",
        body: JSON.stringify({ payment_method: method })
      })
      if (res.ok) {
        fetchOrders()
        setPayTarget(null)
        setStaffPayTarget(null)
        setViewOrder(null)
      } else {
        const err = await res.json()
        alert(err.error || "Payment failed")
      }
    } catch (err) { alert("Network error") }
  }

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{isInternal ? "Orders Matrix" : "My Order History"}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{isInternal ? "Manage customer transactions" : "View your past purchases"}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard icon={FiShoppingBag} label="Total Orders" value={orders.length} iconClass="text-sky-400 bg-sky-50 dark:bg-sky-950/40" cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiCheckCircle} label="Paid" value={paid.length} iconClass="text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiClock} label="Unpaid" value={unpaid.length} iconClass="text-orange-400 bg-orange-50 dark:bg-orange-950/40" cardClass="border-box-border-warn bg-box-border-warn-bg"/>
        <StatCard icon={isInternal ? FiDollarSign : FiUser} label={isInternal ? "Total Revenue" : "User Profile"} value={isInternal ? `$${revenue.toLocaleString()}` : user?.name} iconClass="text-violet-400 bg-violet-50 dark:bg-violet-950/40" cardClass="border-box-border bg-box-border-bg"/>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-box-bg dark:bg-box-dark-bg shadow-sm">
          <FiSearch size={16} className="text-slate-400 shrink-0"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm outline-none"/>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-box-bg dark:bg-box-dark-bg border border-black/10 dark:border-white/10">
          {["all", "paid", "unpaid"].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${filter === t ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-600"}`}>{t}</button>
          ))}
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          {loading ? <div className="flex items-center justify-center h-full animate-pulse text-sky-500"><FiActivity size={40}/></div> : (
            <table className="w-full min-w-[620px]">
              <thead className="sticky top-0 bg-transparent/90 dark:bg-slate-900/60 backdrop-blur-sm z-10">
                <tr className="border-b border-black/[.06]">
                  <SortTh label="Order #" field="id" sort={sort} onSort={handleSort} className="pl-5"/>
                  {isInternal && <SortTh label="Customer" field="customer" sort={sort} onSort={handleSort}/>}
                  <SortTh label="Date" field="date" sort={sort} onSort={handleSort}/>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase">Items</th>
                  <SortTh label="Total" field="total" sort={sort} onSort={handleSort}/>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase">Payment</th>
                  <th className="px-4 py-3 pr-5 text-right text-[11px] font-bold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.04]">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-black/[.01] transition-colors group">
                    <td className="px-4 py-3 pl-5 font-mono text-sm">#{String(o.id).padStart(4,"0")}</td>
                    {isInternal && <td className="px-4 py-3 text-sm font-bold">{o.customer_name}</td>}
                    <td className="px-4 py-3 text-sm text-slate-500">{o.date}</td>
                    <td className="px-4 py-3"><span className="w-6 h-6 rounded-full bg-transparent flex items-center justify-center text-[10px] font-black">{o.details?.length}</span></td>
                    <td className="px-4 py-3 text-sm font-black">${orderTotal(o).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${o.payment_status ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
                        {o.payment_status ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                       {!o.payment_status ? (
                         <button 
                           onClick={() => isInternal ? setStaffPayTarget(o) : setPayTarget(o)}
                           className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                         ><FiCreditCard/></button>
                       ) : <FiCheck className="text-emerald-500 mx-auto"/>}
                    </td>
                    <td className="px-4 py-3 pr-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>setViewOrder(o)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500"><FiEye/></button>
                        {isInternal && <button onClick={()=>setDelTarget(o)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"><FiTrash2/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {viewOrder && <OrderDetailModal order={viewOrder} onTogglePaid={(o)=>isInternal ? setStaffPayTarget(o) : setPayTarget(o)} onClose={()=>setViewOrder(null)} isInternal={isInternal}/>}
      {payTarget && <PaymentQRModal amount={orderTotal(payTarget)} orderId={payTarget.id} onDone={()=>processPayment(payTarget.id, "Transfer")} onClose={()=>setPayTarget(null)}/>}
      {staffPayTarget && <StaffPaymentModal order={staffPayTarget} onConfirm={(m)=>processPayment(staffPayTarget.id, m)} onClose={()=>setStaffPayTarget(null)}/>}
      {delTarget && <ConfirmDelete name={`Order #${delTarget.id}`} onConfirm={async()=>{await authFetch(`/orders/${delTarget.id}`,{method:"DELETE"}); fetchOrders(); setDelTarget(null)}} onClose={()=>setDelTarget(null)}/>}
    </div>
  )
}
