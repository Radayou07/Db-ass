import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { FiTag, FiPlus, FiEdit2, FiActivity, FiX, FiCheckCircle, FiXCircle } from "react-icons/fi"

export default function Discounts() {
  const { authFetch } = useAuth()
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: "", type: "percent", value: 0, min_order: 0, expires_at: "", is_active: true
  })

  useEffect(() => {
    fetchDiscounts()
  }, [])

  async function fetchDiscounts() {
    setLoading(true)
    try {
      const res = await authFetch("/discount")
      if (res.ok) {
        setDiscounts(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id, currentStatus) => {
    try {
      const res = await authFetch(`/discount/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (res.ok) {
        fetchDiscounts()
      }
    } catch (err) {
      alert("Failed to update status")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await authFetch("/discount", {
        method: "POST",
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsModalOpen(false)
        fetchDiscounts()
      } else {
        const err = await res.json()
        alert(err.error || "Failed to create discount")
      }
    } catch (err) {
      alert("Network error")
    }
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-box-bg dark:bg-box-dark-bg p-5 rounded-3xl border border-box-border dark:border-box-dark-border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Coupons & Discounts</h1>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 font-semibold uppercase tracking-widest">Manage store promotions</p>
        </div>
        <button 
          onClick={() => { setFormData({ code: "", type: "percent", value: 0, min_order: 0, expires_at: "", is_active: true }); setIsModalOpen(true) }}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-sky-200 dark:shadow-none active:scale-95"
        >
          <FiPlus size={18} /> New Coupon
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-box-bg dark:bg-box-dark-bg rounded-3xl border border-box-border dark:border-box-dark-border">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sky-500 animate-pulse"><FiActivity size={40}/></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-black/5 dark:border-white/5 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Min Order</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Expires</th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {discounts.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white uppercase tracking-wider">{d.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 capitalize">{d.type}</td>
                  <td className="px-6 py-4 font-black text-sky-500">{d.type === 'percent' ? `${d.value}%` : `$${d.value}`}</td>
                  <td className="px-6 py-4 text-sm">${d.min_order}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{d.expires_at || 'Never'}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleToggle(d.id, d.is_active)}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm transition-all
                        ${d.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}
                    >
                      {d.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">No coupons exist.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2"><FiX size={20}/></button>
            <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2"><FiTag className="text-sky-500"/> New Coupon</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coupon Code</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-sky-500 uppercase font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-bold">
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Value</label>
                  <input required type="number" step="0.01" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min Order ($)</label>
                  <input type="number" step="0.01" value={formData.min_order} onChange={e => setFormData({...formData, min_order: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expires (Optional)</label>
                  <input type="date" value={formData.expires_at} onChange={e => setFormData({...formData, expires_at: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-sky-500 font-bold" />
                </div>
              </div>
              <button type="submit" className="w-full py-4 mt-4 bg-sky-500 hover:bg-sky-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95">
                Create Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}