// src/pages/Customer.jsx
import { useState, useMemo } from "react"
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
  FiUser, FiPhone, FiMapPin, FiUsers, FiShoppingBag,
  FiChevronUp, FiChevronDown, FiAlertTriangle,
} from "react-icons/fi"

/* ─── Mock data (replace with API calls) ─── */
let nextId = 8
const SEED = [
  { id: 1, name: "Alice Johnson",  number: "012-345-6789", address: "123 Maple St, Phnom Penh",    orders: 12 },
  { id: 2, name: "Bob Chen",       number: "011-234-5678", address: "45 River Rd, Siem Reap",       orders: 8  },
  { id: 3, name: "Sara Moon",      number: "096-111-2222", address: "78 Lotus Ave, Battambang",     orders: 7  },
  { id: 4, name: "Dev Patel",      number: "089-333-4444", address: "9 Palm Lane, Kampot",          orders: 5  },
  { id: 5, name: "Maria Santos",   number: "077-555-6666", address: "22 Hill Blvd, Takeo",          orders: 14 },
  { id: 6, name: "James Wright",   number: "093-777-8888", address: "5 Sunset Dr, Kandal",          orders: 3  },
  { id: 7, name: "Nara Kim",       number: "016-999-0000", address: "101 Blue St, Kampong Cham",    orders: 9  },
]

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
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
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
    if (!form.name.trim())    e.name    = "Name is required"
    if (!form.number.trim())  e.number  = "Phone number is required"
    if (!form.address.trim()) e.address = "Address is required"
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
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? "Update customer details" : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors
                ${errors[field]
                  ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                  : "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus-within:border-sky-400"
                }`}>
                <Icon size={15} className="text-slate-400 shrink-0" />
                <input
                  type={type}
                  value={form[field]}
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
            className="px-4 py-2 text-sm rounded-xl text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
          <p className="text-sm text-slate-400 mt-1">
            Are you sure you want to delete <span className="font-medium text-slate-600 dark:text-slate-300">{customer.name}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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

/* ─── Sortable column header ─── */
function SortTh({ label, field, sort, onSort, className = "" }) {
  const active = sort.field === field
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-slate-600 dark:hover:text-slate-200 transition-colors ${className}`}
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
export default function Customer() {
  const [customers, setCustomers] = useState(SEED)
  const [search,    setSearch]    = useState("")
  const [sort,      setSort]      = useState({ field: "name", dir: "asc" })
  const [modal,     setModal]     = useState(null)   // null | { mode:"add"|"edit", data? }
  const [delTarget, setDelTarget] = useState(null)   // customer to delete

  /* Derived */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q) ||
      c.address.toLowerCase().includes(q)
    )
    return list.sort((a, b) => {
      const va = sort.field === "orders" ? a[sort.field] : a[sort.field]?.toLowerCase?.() ?? a[sort.field]
      const vb = sort.field === "orders" ? b[sort.field] : b[sort.field]?.toLowerCase?.() ?? b[sort.field]
      if (va < vb) return sort.dir === "asc" ? -1 : 1
      if (va > vb) return sort.dir === "asc" ?  1 : -1
      return 0
    })
  }, [customers, search, sort])

  const totalOrders = customers.reduce((s, c) => s + c.orders, 0)

  /* Sort toggle */
  function handleSort(field) {
    setSort(s => s.field === field
      ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
      : { field, dir: "asc" }
    )
  }

  /* CRUD */
  function handleSave(form) {
    if (modal.mode === "add") {
      setCustomers(cs => [...cs, { ...form, id: nextId++, orders: 0 }])
    } else {
      setCustomers(cs => cs.map(c => c.id === modal.data.id ? { ...c, ...form } : c))
    }
    setModal(null)
  }

  function handleDelete() {
    setCustomers(cs => cs.filter(c => c.id !== delTarget.id))
    setDelTarget(null)
  }

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-200">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Customers</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your customer records</p>
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
          <table className="w-full min-w-[560px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/60 backdrop-blur-sm">
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
                  className="hover:bg-slate-50/60 dark:hover:bg-white/[.03] transition-colors group"
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
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {c.number}
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                    {c.address}
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                      {c.orders}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ mode: "edit", data: c })}
                        title="Edit"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDelTarget(c)}
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
    </div>
  )
}   