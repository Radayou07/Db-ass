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
    // We'll need an endpoint to list staff. For now, let's assume we can get them.
    // If not, we'll just show the 'Add' functionality.
    setLoading(false)
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

      <div className="flex-1 bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-black/[.04] dark:border-white/[.06] overflow-hidden flex flex-col items-center justify-center text-center p-10">
        <FiUsers className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-4" />
        <h3 className="text-lg font-bold text-slate-400">Team Catalog Node</h3>
        <p className="text-sm text-slate-400 max-w-xs mt-2">Manage internal users, their credentials, and permission elevations from this terminal.</p>
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
