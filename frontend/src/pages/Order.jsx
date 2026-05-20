import { useState, useMemo } from "react"
import {
  FiSearch, FiTrash2, FiX, FiEye,
  FiShoppingBag, FiDollarSign, FiClock, FiCheckCircle,
  FiChevronUp, FiChevronDown, FiAlertTriangle,
} from "react-icons/fi"

/* ─── Mock data ─── */
// order: id, date, payment_status (0/1), customer_id
// order_detail: id, quantity, price, order_id, product_id
const CUSTOMERS_MAP = {
  1:"Alice Johnson", 2:"Bob Chen", 3:"Sara Moon",
  4:"Dev Patel", 5:"Maria Santos", 6:"James Wright", 7:"Nara Kim",
}
const PRODUCTS_MAP = {
  1:"USB-C Hub Pro", 2:"Mechanical Keyboard", 3:'27" Monitor',
  4:"Webcam 4K", 5:"Laptop Stand", 6:"Portable SSD 1TB", 7:"Headset Pro", 8:"SD Card 256GB",
}

let nextOid = 7
const SEED_ORDERS = [
  { id:1, date:"2025-05-01", payment_status:1, customer_id:1,
    details:[{ id:1, product_id:1, quantity:2, price:49.99 }, { id:2, product_id:4, quantity:1, price:89.99 }] },
  { id:2, date:"2025-05-03", payment_status:0, customer_id:2,
    details:[{ id:3, product_id:2, quantity:1, price:129.99 }] },
  { id:3, date:"2025-05-05", payment_status:1, customer_id:3,
    details:[{ id:4, product_id:7, quantity:1, price:159.99 }, { id:5, product_id:5, quantity:2, price:39.99 }] },
  { id:4, date:"2025-05-07", payment_status:0, customer_id:5,
    details:[{ id:6, product_id:3, quantity:1, price:349.99 }] },
  { id:5, date:"2025-05-09", payment_status:1, customer_id:7,
    details:[{ id:7, product_id:8, quantity:3, price:29.99 }, { id:8, product_id:1, quantity:1, price:49.99 }] },
  { id:6, date:"2025-05-11", payment_status:0, customer_id:4,
    details:[{ id:9, product_id:6, quantity:2, price:99.99 }] },
]

const orderTotal = o => o.details.reduce((s, d) => s + d.quantity * d.price, 0)

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

/* ─── Detail modal ─── */
function OrderDetailModal({ order, onTogglePaid, onClose }) {
  const total = orderTotal(order)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[.05] dark:border-white/[.06]">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">Order #{order.id}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{CUSTOMERS_MAP[order.customer_id]} · {order.date}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <FiX size={18}/>
          </button>
        </div>

        {/* Items */}
        <div className="px-6 py-4 flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Items</p>
          <div className="rounded-xl overflow-hidden border border-black/[.05] dark:border-white/[.06]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-black/[.05] dark:border-white/[.06]">
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-2 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Qty</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-2 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.04] dark:divide-white/[.04]">
                {order.details.map(d => (
                  <tr key={d.id}>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{PRODUCTS_MAP[d.product_id]}</td>
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
            <button onClick={() => onTogglePaid(order.id)}
              className="text-xs text-sky-500 hover:underline transition-colors">
              Mark as {order.payment_status ? "unpaid" : "paid"}
            </button>
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
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function Order() {
  const [orders,    setOrders]    = useState(SEED_ORDERS)
  const [search,    setSearch]    = useState("")
  const [filter,    setFilter]    = useState("all")  // "all" | "paid" | "unpaid"
  const [sort,      setSort]      = useState({ field:"date", dir:"desc" })
  const [viewOrder, setViewOrder] = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  const paid     = orders.filter(o => o.payment_status === 1)
  const unpaid   = orders.filter(o => o.payment_status === 0)
  const revenue  = paid.reduce((s, o) => s + orderTotal(o), 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders
      .filter(o => {
        const matchSearch = String(o.id).includes(q) ||
          CUSTOMERS_MAP[o.customer_id]?.toLowerCase().includes(q) ||
          o.date.includes(q)
        const matchFilter =
          filter === "all"    ? true :
          filter === "paid"   ? o.payment_status === 1 :
          o.payment_status === 0
        return matchSearch && matchFilter
      })
      .sort((a, b) => {
        if (sort.field === "total") {
          const d = orderTotal(a) - orderTotal(b)
          return sort.dir === "asc" ? d : -d
        }
        if (sort.field === "customer") {
          const na = CUSTOMERS_MAP[a.customer_id], nb = CUSTOMERS_MAP[b.customer_id]
          return sort.dir === "asc" ? na.localeCompare(nb) : nb.localeCompare(na)
        }
        const va = a[sort.field], vb = b[sort.field]
        if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === "asc" ? va - vb : vb - va
      })
  }, [orders, search, filter, sort])

  function handleSort(f) {
    setSort(s => s.field === f ? { field:f, dir: s.dir==="asc" ? "desc" : "asc" } : { field:f, dir:"asc" })
  }

  function togglePaid(id) {
    setOrders(os => os.map(o => o.id === id ? { ...o, payment_status: o.payment_status ? 0 : 1 } : o))
    setViewOrder(v => v?.id === id ? { ...v, payment_status: v.payment_status ? 0 : 1 } : v)
  }

  function handleDelete() {
    setOrders(os => os.filter(o => o.id !== delTarget.id))
    setDelTarget(null)
  }

  const FILTER_TABS = [
    { key:"all",    label:"All",    count: orders.length  },
    { key:"paid",   label:"Paid",   count: paid.length    },
    { key:"unpaid", label:"Unpaid", count: unpaid.length  },
  ]

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-200">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track and manage customer orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard icon={FiShoppingBag}  label="Total Orders"   value={orders.length}
          iconClass="text-sky-400 bg-sky-50 dark:bg-sky-950/40"     cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiCheckCircle}  label="Paid"           value={paid.length}
          iconClass="text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiClock}        label="Unpaid"         value={unpaid.length}
          iconClass="text-orange-400 bg-orange-50 dark:bg-orange-950/40" cardClass="border-box-border-warn bg-box-border-warn-bg"/>
        <StatCard icon={FiDollarSign}   label="Total Revenue"  value={`$${revenue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
          iconClass="text-violet-400 bg-violet-50 dark:bg-violet-950/40" cardClass="border-box-border bg-box-border-bg"/>
      </div>

      {/* Search + filter tabs */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/10
                        dark:border-white/10 bg-box-bg dark:bg-box-dark-bg shadow-sm">
          <FiSearch size={16} className="text-slate-400 shrink-0"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID, customer, or date…"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200
                       placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"/>
          {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition-colors"><FiX size={15}/></button>}
        </div>
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-box-bg dark:bg-box-dark-bg border border-black/10 dark:border-white/10">
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filter === t.key
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
              }`}>
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                filter === t.key ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[620px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/60 backdrop-blur-sm">
              <tr className="border-b border-black/[.06] dark:border-white/[.06]">
                <SortTh label="Order #"  field="id"       sort={sort} onSort={handleSort} className="pl-5"/>
                <SortTh label="Customer" field="customer" sort={sort} onSort={handleSort}/>
                <SortTh label="Date"     field="date"     sort={sort} onSort={handleSort}/>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Items</th>
                <SortTh label="Total"    field="total"    sort={sort} onSort={handleSort}/>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 pr-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.04] dark:divide-white/[.04]">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">No orders found.</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[.03] transition-colors group">
                  <td className="px-4 py-3 pl-5">
                    <span className="text-sm font-mono font-semibold text-slate-500 dark:text-slate-400">
                      #{String(o.id).padStart(4, "0")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                    {CUSTOMERS_MAP[o.customer_id]}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{o.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold
                                     bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                      {o.details.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                    ${orderTotal(o).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePaid(o.id)}
                      title="Click to toggle payment status"
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        o.payment_status
                          ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60"
                          : "bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/60"
                      }`}>
                      {o.payment_status ? "Paid" : "Unpaid"}
                    </button>
                  </td>
                  <td className="px-4 py-3 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewOrder(o)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors">
                        <FiEye size={14}/>
                      </button>
                      <button onClick={() => setDelTarget(o)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors">
                        <FiTrash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 border-t border-black/[.04] dark:border-white/[.04] shrink-0">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-medium text-slate-500 dark:text-slate-300">{filtered.length}</span> of{" "}
            <span className="font-medium text-slate-500 dark:text-slate-300">{orders.length}</span> orders
          </p>
        </div>
      </Card>

      {viewOrder && <OrderDetailModal order={viewOrder} onTogglePaid={togglePaid} onClose={() => setViewOrder(null)}/>}
      {delTarget && <ConfirmDelete name={`Order #${String(delTarget.id).padStart(4,"0")}`} onConfirm={handleDelete} onClose={() => setDelTarget(null)}/>}
    </div>
  )
}