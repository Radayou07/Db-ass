// src/pages/Customer.jsx
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
  FiUser, FiPhone, FiMapPin, FiUsers, FiShoppingBag,
  FiChevronUp, FiChevronDown, FiAlertTriangle, FiActivity, FiCalendar, FiDollarSign
} from "react-icons/fi"

/* ─── Helpers ─── */
const AVATAR_COLORS = [
  "bg-sky-500", "bg-violet-500", "bg-teal-500",
  "bg-orange-400", "bg-rose-500", "bg-emerald-500", "bg-amber-500",
]
const avatarColor = id => AVATAR_COLORS[id % AVATAR_COLORS.length]
const initials = name => name.trim().split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()

const EMPTY_FORM = { name: "", number: "", address: "" }

/* ─── Sub-components ─── */

function Card({ children, className = "" }) {
  return (
    <div className={`bg-box-bg dark:bg-box-dark-bg rounded-xl shadow-sm border border-black/[.04] dark:border-white/[.06] ${className}`}>
      {children}
    </div>
  )
}

/* Stat card */
function StatCard({ icon: Icon, label, value, iconClass, cardClass }) {
  return (
    <Card className={`flex items-center gap-4 p-4 border-2 ${cardClass}`}>
      <span className={`p-2.5 rounded-xl ${iconClass}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-[11px] text-slate-400 dark:text-slate-300 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
      </div>
    </Card>
  )
}

/* Add / Edit modal */
function CustomerModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.name?.trim())    e.name    = "Name is required"
    if (!form.number?.trim())  e.number  = "Phone number is required"
    if (!form.address?.trim()) e.address = "Address is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (validate()) onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[.05] dark:border-white/[.06]">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              {isEdit ? "Edit Customer" : "New Customer"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">
              {isEdit ? "Update customer details" : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-transparent/5 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {[
            { field: "name",    label: "Full Name",     icon: FiUser,   placeholder: "e.g. Alice Johnson",       type: "text"  },
            { field: "number",  label: "Phone Number",  icon: FiPhone,  placeholder: "e.g. 012-345-6789",        type: "tel"   },
            { field: "address", label: "Address",       icon: FiMapPin, placeholder: "Street, City, Province",   type: "text"  },
          ].map(({ field, label, icon: Icon, placeholder, type }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1.5">{label}</label>
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors
                ${errors[field]
                  ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                  : "border-black/10 dark:border-white/10 bg-transparent dark:bg-transparent/5 focus-within:border-sky-400"
                }`}>
                <Icon size={15} className="text-slate-400 dark:text-slate-300 shrink-0" />
                <input
                  type={type}
                  value={form[field] || ""}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                />
              </div>
              {errors[field] && (
                <p className="text-[11px] text-red-400 mt-1">{errors[field]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-transparent/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm"
          >
            {isEdit ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* Delete confirm modal */
function DeleteModal({ customer, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08] p-6 flex flex-col items-center gap-4 text-center">
        <span className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
          <FiAlertTriangle size={22} className="text-red-500" />
        </span>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Delete Customer</h3>
          <p className="text-sm text-slate-400 dark:text-slate-300 mt-1">
            Are you sure you want to delete <span className="font-medium text-slate-600 dark:text-slate-300">{customer.name}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-transparent/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Customer Details Modal ─── */
function CustomerDetailsModal({ customer, onClose }) {
  const { authFetch } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [customer.id])

  async function fetchHistory() {
    setLoading(true)
    try {
      const res = await authFetch(`/customers/${customer.id}/orders`)
      if (res.ok) setHistory(await res.json())
    } catch (err) {
      console.error("Fetch history failed", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[.05] dark:border-white/[.06]">
          <div className="flex items-center gap-4">
            <span className={`w-12 h-12 rounded-2xl ${avatarColor(customer.id)} flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-lg`}>
              {initials(customer.name)}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{customer.name}</h2>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-300 mt-0.5">
                 <span className="flex items-center gap-1"><FiPhone size={10}/> {customer.number}</span>
                 <span className="flex items-center gap-1 text-sky-500"><FiMapPin size={10}/> {customer.address}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-transparent/10 transition-all"><FiX size={20} /></button>
        </div>

        {/* History Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
           <div className="px-6 py-4 bg-slate-50/50 dark:bg-transparent/20 border-b border-black/[.02] dark:border-white/[.02] flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <FiShoppingBag className="text-sky-500"/> Purchase History
              </h3>
              <span className="text-[10px] font-black bg-sky-100 dark:bg-sky-950/50 text-sky-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {history.length} Transactions
              </span>
           </div>

           <div className="flex-1 overflow-y-auto px-6 py-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                   <FiActivity size={32} className="text-sky-500 animate-pulse"/>
                   <p className="text-xs text-slate-400 dark:text-slate-300 font-medium">Syncing Ledger...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40 italic">
                   <FiShoppingBag size={40} className="text-slate-300"/>
                   <p className="text-sm text-slate-400 dark:text-slate-300">No transaction records found for this entity.</p>
                </div>
              ) : (
                <div className="space-y-3 py-4">
                   {history.map((order, idx) => (
                     <div key={order.id} className="group p-4 rounded-2xl bg-white dark:bg-transparent/[.02] border border-black/[.03] dark:border-white/[.03] hover:border-sky-400/30 transition-all shadow-xs hover:shadow-md">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2 text-slate-400">
                              <FiCalendar size={12}/>
                              <span className="text-xs font-bold tracking-tight">{new Date(order.date).toLocaleDateString(undefined, {year:'numeric', month:'short', day:'numeric'})}</span>
                           </div>
                           <div className="text-[10px] font-black text-slate-300 group-hover:text-sky-500 transition-colors">#{order.id.toString().padStart(5, '0')}</div>
                        </div>
                        <div className="flex items-end justify-between">
                           <div>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                              <p className="text-sm font-black text-slate-800 dark:text-white">{order.total_items} Items <span className="text-slate-300 font-normal ml-1">in Cart</span></p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 text-teal-500">Gross Total</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                                 <FiDollarSign className="text-teal-500" size={16}/>
                                 {Number(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                              </p>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[.05] dark:border-white/[.06] bg-slate-50/30 dark:bg-transparent/10">
           <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-transparent dark:bg-transparent/5 border border-black/5 dark:border-white/5 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-transparent/10 transition-all">Close Terminal</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Sortable column header ─── */
function SortTh({ label, field, sort, onSort, className = "" }) {
  const active = sort.field === field
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-slate-600 dark:hover:text-slate-200 transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="flex flex-col">
          <FiChevronUp   size={10} className={active && sort.dir === "asc"  ? "text-sky-400" : "opacity-30"} />
          <FiChevronDown size={10} className={active && sort.dir === "desc" ? "text-sky-400" : "opacity-30"} />
        </span>
      </span>
    </th>
  )
}

/* ─── Main page ─── */
export default function Customers() {
  const { authFetch } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState("")
  const [sort,      setSort]      = useState({ field: "name", dir: "asc" })
  const [modal,     setModal]     = useState(null)   // null | { mode:"add"|"edit", data? }
  const [delTarget, setDelTarget] = useState(null)   // customer to delete
  const [viewTarget, setViewTarget] = useState(null) // customer to view details

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    try {
      const res = await authFetch("/customers")
      if (res.ok) setCustomers(await res.json())
    } catch (err) {
      console.error("Fetch customers failed", err)
    } finally {
      setLoading(false)
    }
  }

  /* Derived */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q) ||
      c.address.toLowerCase().includes(q)
    )
    return list.sort((a, b) => {
      const va = sort.field === "orders" ? (a.orders?.length || 0) : a[sort.field]?.toLowerCase?.() ?? a[sort.field]
      const vb = sort.field === "orders" ? (b.orders?.length || 0) : b[sort.field]?.toLowerCase?.() ?? b[sort.field]
      if (va < vb) return sort.dir === "asc" ? -1 : 1
      if (va > vb) return sort.dir === "asc" ?  1 : -1
      return 0
    })
  }, [customers, search, sort])

  const totalOrders = customers.reduce((s, c) => s + (c.orders?.length || 0), 0)

  /* Sort toggle */
  function handleSort(field) {
    setSort(s => s.field === field
      ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
      : { field, dir: "asc" }
    )
  }

  /* CRUD */
  async function handleSave(form) {
    const isEdit = !!modal.data?.id
    const url = isEdit ? `/customers/${modal.data.id}` : "/customers"
    const method = isEdit ? "PUT" : "POST"

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setModal(null)
        fetchCustomers()
      } else {
        const err = await res.json()
        alert(err.error || "Failed to save customer")
      }
    } catch (err) {
      alert("Network error saving customer")
    }
  }

  async function handleDelete() {
    if (!delTarget) return
    try {
      const res = await authFetch(`/customers/${delTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        setCustomers(cs => cs.filter(c => c.id !== delTarget.id))
        setDelTarget(null)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to delete customer")
      }
    } catch (err) {
      alert("Network error deleting customer")
    }
  }

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-100">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Customers</h1>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Manage your customer records</p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors shadow-sm shadow-sky-200 dark:shadow-none"
        >
          <FiPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <StatCard
          icon={FiUsers}     label="Total Customers" value={customers.length}
          iconClass="text-sky-400 bg-sky-50 dark:bg-sky-950/40"
          cardClass="border-box-border bg-box-border-bg"
        />
        <StatCard
          icon={FiShoppingBag} label="Total Orders" value={totalOrders}
          iconClass="text-violet-400 bg-violet-50 dark:bg-violet-950/40"
          cardClass="border-box-border bg-box-border-bg"
        />
        <StatCard
          icon={FiUser}       label="Search Results" value={filtered.length}
          iconClass="text-teal-400 bg-teal-50 dark:bg-teal-950/40"
          cardClass="border-box-border bg-box-border-bg"
        />
      </div>

      {/* ── Search bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-box-bg dark:bg-box-dark-bg shadow-sm shrink-0">
        <FiSearch size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or address…"
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <FiX size={15} />
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sky-500 animate-pulse">
              <FiActivity size={40} />
            </div>
          ) : (
            <table className="w-full min-w-[560px] border-collapse">
              <thead className="sticky top-0 z-10 bg-transparent/90 dark:bg-slate-900/60 backdrop-blur-sm">
                <tr className="border-b border-black/[.06] dark:border-white/[.06]">
                  <SortTh label="Customer"     field="name"    sort={sort} onSort={handleSort} className="pl-5" />
                  <SortTh label="Phone"        field="number"  sort={sort} onSort={handleSort} />
                  <SortTh label="Address"      field="address" sort={sort} onSort={handleSort} />
                  <SortTh label="Orders"       field="orders"  sort={sort} onSort={handleSort} className="text-right" />
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider pr-5">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/[.04] dark:divide-white/[.04]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                      No customers found{search ? ` for "${search}"` : ""}.
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setViewTarget(c)}
                    className="hover:bg-transparent/60 dark:hover:bg-transparent/[.03] transition-colors group cursor-pointer"
                  >
                    {/* Customer (avatar + name) */}
                    <td className="px-4 py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials(c.name)}
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {c.name}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 whitespace-nowrap">
                      {c.number}
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 max-w-[200px] truncate">
                      {c.address}
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                        {c.orders?.length || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); setModal({ mode: "edit", data: c }) }}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDelTarget(c) }}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer row count */}
        <div className="px-5 py-2.5 border-t border-black/[.04] dark:border-white/[.04] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-medium text-slate-500 dark:text-slate-300">{filtered.length}</span> of{" "}
            <span className="font-medium text-slate-500 dark:text-slate-300">{customers.length}</span> customers
          </p>
          {search && (
            <button onClick={() => setSearch("")} className="text-[11px] text-sky-500 hover:underline transition-colors">
              Clear filter
            </button>
          )}
        </div>
      </Card>

      {/* ── Modals ── */}
      {modal && (
        <CustomerModal
          initial={modal.mode === "edit" ? modal.data : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {delTarget && (
        <DeleteModal
          customer={delTarget}
          onConfirm={handleDelete}
          onClose={() => setDelTarget(null)}
        />
      )}
      {viewTarget && (
        <CustomerDetailsModal
          customer={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
    </div>
  )
}   
