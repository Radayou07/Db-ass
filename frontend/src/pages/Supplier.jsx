import { useState, useMemo } from "react"
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
  FiTruck, FiUsers, FiMail, FiPhone, FiMapPin,
  FiChevronUp, FiChevronDown, FiAlertTriangle,
} from "react-icons/fi"

/* ─── Mock data ─── */
// supplier: id, name, number, email, address
let nextSid = 7
const SEED_SUPPLIERS = [
  { id:1, name:"Anker Technology",    number:"023-100-1001", email:"sales@anker.com",      address:"Shenzhen, China",        purchases:18 },
  { id:2, name:"Keychron",            number:"023-100-1002", email:"orders@keychron.com",  address:"Hong Kong",               purchases:7  },
  { id:3, name:"LG Electronics",      number:"023-100-1003", email:"b2b@lg.com",           address:"Seoul, South Korea",      purchases:4  },
  { id:4, name:"Logitech",            number:"023-100-1004", email:"partners@logitech.com",address:"Lausanne, Switzerland",   purchases:22 },
  { id:5, name:"Samsung",             number:"023-100-1005", email:"trade@samsung.com",    address:"Suwon, South Korea",      purchases:11 },
  { id:6, name:"SanDisk (WD)",        number:"023-100-1006", email:"supply@sandisk.com",   address:"Milpitas, CA, USA",       purchases:9  },
]

const EMPTY = { name:"", number:"", email:"", address:"" }

/* ─── Helpers ─── */
const AVATAR_COLORS = [
  "bg-sky-500","bg-violet-500","bg-teal-500",
  "bg-orange-400","bg-rose-500","bg-emerald-500","bg-amber-500",
]
const avatarColor = id => AVATAR_COLORS[id % AVATAR_COLORS.length]
const initials    = name => name.trim().split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()

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
          <h3 className="font-semibold text-slate-800 dark:text-white">Delete Supplier</h3>
          <p className="text-sm text-slate-400 mt-1">
            Remove <span className="font-medium text-slate-600 dark:text-slate-300">{name}</span> from your supplier list?
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Supplier modal ─── */
function SupplierModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial ?? EMPTY)
  const [errors, setErrors] = useState({})

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name    = "Required"
    if (!form.number.trim())  e.number  = "Required"
    if (!form.email.trim())   e.email   = "Required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email"
    if (!form.address.trim()) e.address = "Required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (validate()) onSave(form)
  }

  const wrap = f => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-colors ${
    errors[f]
      ? "border-red-400 bg-red-50 dark:bg-red-950/20"
      : "border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus-within:border-sky-400"
  }`
  const inp = "flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"

  const FIELDS = [
    { f:"name",    label:"Company Name",  Icon:FiTruck, placeholder:"e.g. Anker Technology", type:"text"  },
    { f:"number",  label:"Phone Number",  Icon:FiPhone, placeholder:"e.g. 023-100-1001",     type:"tel"   },
    { f:"email",   label:"Email Address", Icon:FiMail,  placeholder:"e.g. sales@company.com", type:"email" },
    { f:"address", label:"Address",       Icon:FiMapPin,placeholder:"City, Country",          type:"text"  },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-md bg-box-bg dark:bg-box-dark-bg rounded-2xl shadow-2xl border border-black/[.06] dark:border-white/[.08]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/[.05] dark:border-white/[.06]">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              {isEdit ? "Edit Supplier" : "New Supplier"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? "Update supplier information" : "Add a new supplier to your network"}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <FiX size={18}/>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {FIELDS.map(({ f, label, Icon, placeholder, type }) => (
            <div key={f}>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
              <div className={wrap(f)}>
                <Icon size={14} className="text-slate-400 shrink-0"/>
                <input type={type} value={form[f]} onChange={set(f)} placeholder={placeholder} className={inp}/>
              </div>
              {errors[f] && <p className="text-[11px] text-red-400 mt-1">{errors[f]}</p>}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 pb-5 pt-1">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-colors shadow-sm">
            {isEdit ? "Save Changes" : "Add Supplier"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function Supplier() {
  const [suppliers, setSuppliers] = useState(SEED_SUPPLIERS)
  const [search,    setSearch]    = useState("")
  const [sort,      setSort]      = useState({ field:"name", dir:"asc" })
  const [modal,     setModal]     = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  const totalPurchases = suppliers.reduce((s, p) => s + p.purchases, 0)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return suppliers
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.number.includes(q) ||
        s.address.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const va = sort.field === "purchases" ? a.purchases : a[sort.field]
        const vb = sort.field === "purchases" ? b.purchases : b[sort.field]
        if (typeof va === "string") return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === "asc" ? va - vb : vb - va
      })
  }, [suppliers, search, sort])

  function handleSort(f) {
    setSort(s => s.field === f ? { field:f, dir: s.dir==="asc" ? "desc" : "asc" } : { field:f, dir:"asc" })
  }

  function handleSave(form) {
    if (modal.mode === "add") setSuppliers(ss => [...ss, { ...form, id: nextSid++, purchases: 0 }])
    else setSuppliers(ss => ss.map(s => s.id === modal.data.id ? { ...s, ...form } : s))
    setModal(null)
  }

  function handleDelete() {
    setSuppliers(ss => ss.filter(s => s.id !== delTarget.id))
    setDelTarget(null)
  }

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-200">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Suppliers</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your supplier network</p>
        </div>
        <button onClick={() => setModal({ mode:"add" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600
                     text-white text-sm font-medium transition-colors shadow-sm shadow-sky-200 dark:shadow-none">
          <FiPlus size={16}/> Add Supplier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <StatCard icon={FiTruck} label="Total Suppliers" value={suppliers.length}
          iconClass="text-sky-400 bg-sky-50 dark:bg-sky-950/40"       cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiUsers} label="Search Results"  value={filtered.length}
          iconClass="text-teal-400 bg-teal-50 dark:bg-teal-950/40"    cardClass="border-box-border bg-box-border-bg"/>
        <StatCard icon={FiMail}  label="Total Purchases" value={totalPurchases}
          iconClass="text-violet-400 bg-violet-50 dark:bg-violet-950/40" cardClass="border-box-border bg-box-border-bg"/>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-black/10
                      dark:border-white/10 bg-box-bg dark:bg-box-dark-bg shadow-sm shrink-0">
        <FiSearch size={16} className="text-slate-400 shrink-0"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email, or location…"
          className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200
                     placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"/>
        {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition-colors"><FiX size={15}/></button>}
      </div>

      {/* Table */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-900/60 backdrop-blur-sm">
              <tr className="border-b border-black/[.06] dark:border-white/[.06]">
                <SortTh label="Supplier"  field="name"      sort={sort} onSort={handleSort} className="pl-5"/>
                <SortTh label="Phone"     field="number"    sort={sort} onSort={handleSort}/>
                <SortTh label="Email"     field="email"     sort={sort} onSort={handleSort}/>
                <SortTh label="Location"  field="address"   sort={sort} onSort={handleSort}/>
                <SortTh label="Purchases" field="purchases" sort={sort} onSort={handleSort}/>
                <th className="px-4 py-3 pr-5 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[.04] dark:divide-white/[.04]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-slate-400">No suppliers found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[.03] transition-colors group">
                  {/* Name + avatar */}
                  <td className="px-4 py-3 pl-5">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full ${avatarColor(s.id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials(s.name)}
                      </span>
                      <span className="text-sm font-medium whitespace-nowrap">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{s.number}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{s.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{s.address}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-semibold
                                     bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
                      {s.purchases}
                    </span>
                  </td>
                  <td className="px-4 py-3 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal({ mode:"edit", data:s })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors">
                        <FiEdit2 size={14}/>
                      </button>
                      <button onClick={() => setDelTarget(s)}
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
        <div className="px-5 py-2.5 border-t border-black/[.04] dark:border-white/[.04] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-medium text-slate-500 dark:text-slate-300">{filtered.length}</span> of{" "}
            <span className="font-medium text-slate-500 dark:text-slate-300">{suppliers.length}</span> suppliers
          </p>
          {search && (
            <button onClick={() => setSearch("")} className="text-[11px] text-sky-500 hover:underline transition-colors">Clear filter</button>
          )}
        </div>
      </Card>

      {modal     && <SupplierModal initial={modal.mode==="edit" ? modal.data : undefined} onSave={handleSave} onClose={() => setModal(null)}/>}
      {delTarget && <ConfirmDelete name={delTarget.name} onConfirm={handleDelete} onClose={() => setDelTarget(null)}/>}
    </div>
  )
}