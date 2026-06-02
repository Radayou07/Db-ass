import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  FiUserPlus, FiUsers, FiMail, FiPhone, FiShield, FiX, FiCheck, FiActivity, FiTrash2
} from "react-icons/fi"

export default function Staff() {
  const { authFetch, isAdmin } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: "", number: "", email: "", password: "", role: "staff"
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    try {
      const res = await authFetch("/auth/staff")
      if (res.ok) {
        const data = await res.json()
        setStaff(data)
      }
    } catch (err) {
      console.error("Failed to fetch staff", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Remove this staff member from the system?")) return
    try {
      const res = await authFetch(`/auth/staff/${id}`, { method: "DELETE" })
      if (res.ok) fetchStaff()
      else {
        const data = await res.json()
        alert(data.error || "Delete failed")
      }
    } catch (err) { alert("Network error") }
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    try {
      const res = await authFetch("/auth/staff", {
        method: "POST",
        body: JSON.stringify(form)
      })
      if (res.ok) {
        alert("Staff member enrolled successfully!")
        setIsModalOpen(false)
        setForm({ name: "", number: "", email: "", password: "", role: "staff" })
        fetchStaff()
      } else {
        const data = await res.json()
        alert(data.error || "Failed to add staff")
      }
    } catch (err) {
      alert("Network error")
    }
  }

  if (!isAdmin) {
    return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">Administrative Elevation Required</div>
  }

  return (
    <div className="h-screen p-6 flex flex-col gap-6 bg-main-bg dark:bg-main-dark-bg text-slate-700 dark:text-slate-200 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiShield className="text-sky-500" /> Staff Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control internal access and roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-all shadow-sm"
        >
          <FiUserPlus /> Enroll Staff
        </button>
      </div>

      <div className="flex-1 bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-black/[.04] dark:border-white/[.06] overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sky-500 animate-pulse">
            <FiActivity size={40} />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <FiUsers className="w-16 h-16 text-slate-200 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Team Catalog Node</h3>
            <p className="text-sm text-slate-400 dark:text-slate-300 max-w-xs mt-2">No internal users found in the system catalog.</p>
          </div>
        ) : (
          <div className="overflow-y-auto h-full">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-black/[.02] dark:bg-white/[.02] backdrop-blur-md">
                <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-black/[.04] dark:border-white/[.06]">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.02] dark:divide-white/[.02]">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-black/[.01] dark:hover:bg-white/[.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {s.id} / #{s.number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500"><FiMail className="w-3 h-3"/> {s.email}</div>
                      <div className="flex items-center gap-2 text-slate-500"><FiPhone className="w-3 h-3"/> {s.number}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteStaff(s.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-black/[.08] dark:border-white/[.1] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center pb-2 border-b border-black/[.05] dark:border-white/[.05]">
              <h2 className="font-bold flex items-center gap-2"><FiUserPlus className="text-sky-500" /> New Staff Enrollment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-sm">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Identity</label>
                  <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Number</label>
                  <input required type="tel" value={form.number} onChange={e => setForm({...form, number: e.target.value})} className="w-full px-3 py-2 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500" placeholder="012-345-678" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Work Email</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500" placeholder="staff@system.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Access Password</label>
                  <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Authorization Level</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500">
                    <option value="staff">Staff (Standard Access)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 mt-2 rounded-xl bg-sky-500 text-white font-bold shadow-md hover:bg-sky-600 transition-all flex items-center justify-center gap-2">
                <FiCheck /> Finalize Enrollment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
