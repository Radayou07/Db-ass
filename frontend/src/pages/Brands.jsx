import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { FiActivity, FiEdit2, FiPlus, FiTag, FiTrash2, FiX } from "react-icons/fi"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Skeleton } from "../components/Skeleton"

const emptyBrand = { name: "", country: "" }

function BrandModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || emptyBrand)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md bg-box-bg dark:bg-box-dark-bg rounded-[2rem] border border-box-border dark:border-box-dark-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-7 py-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{initial ? "Edit Brand" : "Add Brand"}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><FiX size={20} /></button>
        </div>
        <div className="p-7 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Brand Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-sky-500 outline-none text-sm font-bold text-slate-800 dark:text-white shadow-inner" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Country</label>
            <input value={form.country || ""} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Optional" className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-sky-500 outline-none text-sm font-bold text-slate-800 dark:text-white shadow-inner" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-7 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-sky-200 dark:shadow-none disabled:opacity-60">
            {saving ? "Saving..." : "Save Brand"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Brands() {
  const { authFetch } = useAuth()
  const queryClient = useQueryClient()

  // React Query Fetching
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => axios.get('/brands').then(res => res.data)
  })

  const loading = loadingBrands
  const [modal, setModal] = useState(null)

  // Mutations
  const brandMutation = useMutation({
    mutationFn: ({ url, method, data }) => axios({ url, method, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      setModal(null)
    },
    onError: (err) => alert(err.response?.data?.error || "Failed")
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/brands/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands'] }),
    onError: (err) => alert(err.response?.data?.error || "Failed")
  })

  const saveBrand = (form) => {
    const isEdit = !!modal?.id
    brandMutation.mutate({
      url: isEdit ? `/brands/${modal.id}` : "/brands",
      method: isEdit ? "PUT" : "POST",
      data: {
        name: form.name,
        country: form.country || null,
      }
    })
  }

  const deleteBrand = (brand) => {
    if (!confirm(`Delete ${brand.name}?`)) return
    deleteMutation.mutate(brand.id)
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg p-6 overflow-hidden">
      <div className="h-full flex flex-col gap-6">
        <div className="flex items-center justify-between bg-box-bg dark:bg-box-dark-bg p-6 rounded-[2rem] border border-box-border dark:border-box-dark-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Brands</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-1 font-black uppercase tracking-[0.3em]">Product brand catalog</p>
          </div>
          <button onClick={() => setModal(emptyBrand)} className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-sky-200 dark:shadow-none active:scale-95">
            <FiPlus size={18} /> Add Brand
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-box-bg dark:bg-box-dark-bg rounded-[2rem] border border-box-border dark:border-box-dark-border shadow-sm">
          {loading ? (
            <div className="p-8 space-y-4">
               {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="h-full overflow-auto custom-scrollbar">
              <table className="w-full min-w-[640px]">
                <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Brand</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Country</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {brands.map(brand => (
                    <tr key={brand.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center"><FiTag size={18} /></span>
                          <span className="text-sm font-black text-slate-800 dark:text-white">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-300">{brand.country || "No country"}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setModal(brand)} className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-sky-500 border border-slate-100 dark:border-slate-700"><FiEdit2 size={16} /></button>
                          <button onClick={() => deleteBrand(brand)} className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-slate-700"><FiTrash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {brands.length === 0 && (
                    <tr><td colSpan={3} className="py-24 text-center text-sm font-black text-slate-300 uppercase tracking-widest">No brands yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && <BrandModal initial={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveBrand} />}
    </div>
  )
}
