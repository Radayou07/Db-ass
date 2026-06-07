import React, { useState, useEffect, useMemo } from 'react'
import { FiSearch, FiFilter, FiCheck, FiX, FiCalendar, FiTruck, FiActivity, FiDollarSign, FiClock, FiLayers, FiChevronDown, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

/* ─── Receipt (Arrival) Modal (Copy-pasted from Suppliers.jsx for now) ─── */
function ReceiptModal({ purchase, warehouses, onClose, onConfirm }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onConfirm(purchase.id, warehouseId)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
       <div className="bg-box-bg dark:bg-box-dark-bg w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-box-border dark:border-box-dark-border">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 dark:shadow-none border border-emerald-100 dark:border-emerald-900/30">
             <FiLayers size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Select Warehouse</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Which facility is receiving this stock?</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Storage</label>
                <select 
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-emerald-500 transition-all"
                >
                   {warehouses.map(w => (
                     <option key={w.id} value={w.id}>{w.name} (Cap: {w.capacity})</option>
                   ))}
                </select>
             </div>
             
             <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50">
                  {loading ? "Receiving..." : "Confirm"}
                </button>
             </div>
          </form>
       </div>
    </div>
  )
}

/* ─── Purchase Detail Modal ─── */
function PurchaseDetailModal({ purchase, details, loading, onClose }) {
  const { resolveImageUrl } = useAuth()
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
       <div className="bg-box-bg dark:bg-box-dark-bg w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-box-border dark:border-box-dark-border overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shadow-lg border border-amber-100 dark:border-amber-900/30">
                   <FiActivity size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Purchase Detail</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Manifest for PO #{String(purchase.id).padStart(6, '0')}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all">
                <FiX size={24}/>
             </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
             {loading ? (
               <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                  <FiActivity size={40} className="animate-spin text-amber-500"/>
                  <p className="text-[10px] font-black uppercase tracking-widest">Syncing Manifest...</p>
               </div>
             ) : details ? (
               <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     <div className="col-span-6">Product Item</div>
                     <div className="col-span-2 text-center">Price</div>
                     <div className="col-span-2 text-center">Qty</div>
                     <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                  <div className="space-y-2">
                     {details.items?.map(item => (
                       <div key={item.id} className="grid grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-amber-100">
                          <div className="col-span-6 flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {item.image_url ? (
                                  <img 
                                    src={resolveImageUrl(item.image_url)} 
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiActivity size={20} className="text-slate-200"/>
                                )}
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.product_name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: #{item.product_id}</p>
                             </div>
                          </div>
                          <div className="col-span-2 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
                             ${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="col-span-2 text-center">
                             <span className="px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700">
                                {item.quantity}
                             </span>
                          </div>
                          <div className="col-span-2 text-right text-xs font-black text-slate-900 dark:text-white">
                             ${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
             ) : (
               <div className="py-20 text-center text-[10px] font-black text-rose-400 uppercase tracking-widest flex flex-col items-center gap-3">
                  <FiX size={32}/>
                  Manifest loading failed
               </div>
             )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-6">
             {details?.note && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                   <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <FiActivity size={12}/> Order Note
                   </p>
                   <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic">"{details.note}"</p>
                </div>
             )}
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Order Value</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white">${Number(purchase.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <button onClick={onClose} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">
                   Close Manifest
                </button>
             </div>
          </div>
       </div>
    </div>
  )
}

export default function Approvals() {
  const { authFetch } = useAuth()
  const { toast } = useToast()
  
  const [purchases, setPurchases] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })
  const [receiveTarget, setReceiveTarget] = useState(null)
  
  // Expanded Detail State (MODAL)
  const [detailTarget, setDetailTarget] = useState(null)
  const [purchaseDetails, setPurchaseDetails] = useState({})
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function openDetails(purchase) {
    setDetailTarget(purchase)
    if (purchaseDetails[purchase.id]) return

    setDetailLoading(true)
    try {
      const res = await authFetch(`/purchases/${purchase.id}`)
      if (res.ok) {
        const data = await res.json()
        setPurchaseDetails(prev => ({ ...prev, [purchase.id]: data }))
      }
    } catch (err) {
      console.error(err)
      toast("Could not load details", "error")
    } finally {
      setDetailLoading(false)
    }
  }

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [pRes, wRes] = await Promise.all([
        authFetch("/purchases"),
        authFetch("/inventory/warehouses")
      ])
      if (pRes.ok) {
        const data = await pRes.json()
        setPurchases(data.filter(p => p.status === "pending"))
      }
      if (wRes.ok) setWarehouses(await wRes.json())
    } catch (err) {
      console.error(err)
      toast("Error synchronizing data", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleReceive(id, warehouse_id) {
    try {
      const res = await authFetch(`/purchases/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "received", warehouse_id })
      })
      if (res.ok) {
        toast("Stock successfully received and inventory updated")
        setReceiveTarget(null)
        fetchInitialData()
      } else {
        const err = await res.json()
        toast(err.error || "Approval failed", "error")
      }
    } catch (err) {
      toast("Network synchronization error", "error")
    }
  }

  async function handleCancel(id) {
    if (!window.confirm("Are you sure you want to cancel this purchase order?")) return
    try {
      const res = await authFetch(`/purchases/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" })
      })
      if (res.ok) {
        toast("Purchase order cancelled")
        fetchInitialData()
      } else {
        const err = await res.json()
        toast(err.error || "Action failed", "error")
      }
    } catch (err) {
      toast("Network synchronization error", "error")
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return purchases
      .filter(p => 
        p.supplier_name.toLowerCase().includes(q) ||
        p.supplier_phones.some(ph => ph.includes(q)) ||
        p.product_names.some(pn => pn.toLowerCase().includes(q)) ||
        String(p.id).includes(q)
      )
      .sort((a, b) => {
        let va = a[sort.field]
        let vb = b[sort.field]
        if (sort.field === 'price') {
            va = a.total_amount
            vb = b.total_amount
        }
        if (typeof va === 'string') return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        return sort.dir === 'asc' ? va - vb : vb - va
      })
  }, [purchases, search, sort])

  const totalPendingValue = filtered.reduce((sum, p) => sum + p.total_amount, 0)

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg flex flex-col overflow-hidden">
      <div className="p-5 flex-1 flex flex-col gap-5 overflow-hidden">
        
        {/* Header Section */}
        <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Pending Approvals</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Aggregate queue of all supplier purchase orders</p>
          </div>
          
          <div className="flex flex-1 lg:max-w-2xl items-center gap-3">
            <div className="relative flex-1 group">
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by supplier, phone, product, or ID..."
                className="w-full bg-box-bg dark:bg-box-dark-bg pl-12 pr-5 py-3.5 rounded-2xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-bold outline-none border border-box-border dark:border-box-dark-border focus:border-amber-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/30 flex items-center gap-5 shadow-lg shadow-amber-100 dark:shadow-none">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                 <FiClock size={28}/>
              </div>
              <div>
                 <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Awaiting Action</p>
                 <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{filtered.length} Orders</p>
              </div>
           </div>
           
           <div className="p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/30 flex items-center gap-5 shadow-lg shadow-emerald-100 dark:shadow-none">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                 <FiDollarSign size={28}/>
              </div>
              <div>
                 <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Pipeline Value</p>
                 <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">${totalPendingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
           </div>

           <div className="hidden lg:flex p-6 rounded-[2rem] bg-sky-50 dark:bg-sky-950/20 border-2 border-sky-100 dark:border-sky-900/30 items-center gap-5 shadow-lg shadow-sky-100 dark:shadow-none">
              <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg">
                 <FiActivity size={28}/>
              </div>
              <div>
                 <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">Queue Status</p>
                 <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{filtered.length > 5 ? "Busy" : "Manageable"}</p>
              </div>
           </div>
        </div>

        {/* Table/List Area */}
        <div className="flex-1 min-h-0 bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] border border-box-border dark:border-box-dark-border flex flex-col overflow-hidden">
           <div className="shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <FiFilter size={12} className="text-slate-400"/>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Active queue</span>
                 </div>
              </div>
              
              <div className="flex items-center gap-6">
                 <button 
                   onClick={() => setSort(s => ({ field: 'date', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                   className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-sky-500 uppercase tracking-widest transition-colors"
                 >
                    Date {sort.field === 'date' && (sort.dir === 'asc' ? <FiArrowUp/> : <FiArrowDown/>)}
                 </button>
                 <button 
                   onClick={() => setSort(s => ({ field: 'price', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                   className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                 >
                    Price {sort.field === 'price' && (sort.dir === 'asc' ? <FiArrowUp/> : <FiArrowDown/>)}
                 </button>
              </div>
           </div>

           <div className="flex-1 min-h-0 overflow-y-auto p-5 custom-scrollbar">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 opacity-40">
                   <FiActivity size={40} className="animate-spin text-amber-500"/>
                   <p className="text-[10px] font-black uppercase tracking-widest">Syncing Queue...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
                   <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-200">
                      <FiCheck size={42}/>
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-tight">Inbox Zero</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">No pending approvals found</p>
                   </div>
                </div>
              ) : (
                <div className="grid gap-4">
                   {filtered.map(p => (
                     <div key={p.id} className="group rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50 hover:shadow-xl hover:shadow-amber-100/20 dark:hover:shadow-none transition-all duration-300 overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                           
                           {/* Supplier Info */}
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30">
                                    PENDING
                                 </span>
                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    PO #{String(p.id).padStart(6, '0')}
                                 </span>
                              </div>
                              <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{p.supplier_name}</h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                 <span className="flex items-center gap-1.5"><FiCalendar size={12} className="text-sky-500"/> {new Date(p.date).toLocaleDateString()}</span>
                                 <span className="flex items-center gap-1.5"><FiTruck size={12} className="text-violet-500"/> {p.total_items} items</span>
                              </div>
                           </div>

                           {/* Purchase ID Display */}
                           <div className="flex-1 hidden xl:flex flex-col items-center justify-center min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center w-full">Tracking ID</p>
                              <div className="px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                 <p className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-[0.2em]">
                                    ID-{p.id}
                                 </p>
                              </div>
                           </div>

                           {/* Financials */}
                           <div className="shrink-0 md:text-right">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Order Value</p>
                              <p className="text-2xl font-black text-slate-900 dark:text-white">${p.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                           </div>

                           {/* Actions */}
                           <div className="shrink-0 flex gap-2">
                              <button 
                                onClick={() => openDetails(p)}
                                className="px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                              >
                                 View Details
                              </button>
                              <button 
                                onClick={() => setReceiveTarget(p)}
                                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
                              >
                                 <FiCheck size={16}/> Approve
                              </button>
                              <button 
                                onClick={() => handleCancel(p.id)}
                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                              >
                                 <FiX size={18}/>
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>

      {detailTarget && (
        <PurchaseDetailModal
          purchase={detailTarget}
          details={purchaseDetails[detailTarget.id]}
          loading={detailLoading}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {receiveTarget && (
        <ReceiptModal
          purchase={receiveTarget}
          warehouses={warehouses}
          onClose={() => setReceiveTarget(null)}
          onConfirm={handleReceive}
        />
      )}
    </div>
  )
}
