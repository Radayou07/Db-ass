import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { 
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiGrid, FiList, 
  FiPackage, FiHome, FiActivity, FiX, FiLayers, FiMapPin, FiBarChart2 
} from "react-icons/fi"

/* ─── Warehouse Card Component ─── */
function WarehouseCard({ warehouse, usage, onEdit, onDelete }) {
  const percent = Math.min(100, Math.round((usage / warehouse.capacity) * 100))
  const isFull = percent >= 100

  return (
    <div className="bg-box-bg dark:bg-box-dark-bg rounded-xl border border-black/[.04] dark:border-white/[.06] p-4 hover:shadow-md transition-all duration-250">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950/40 flex items-center justify-center text-sky-500">
            <FiHome size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">{warehouse.name}</h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider font-semibold">
              <FiMapPin size={10} /> {warehouse.location}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(warehouse)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"><FiEdit2 size={14} /></button>
          <button onClick={() => onDelete(warehouse)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"><FiTrash2 size={14} /></button>
        </div>
      </div>
      
      <div className="pt-3 border-t border-black/[.02] dark:border-white/[.02]">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Capacity Utilization ({percent}%)</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">{usage} / {warehouse.capacity} units</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-red-500" : "bg-sky-500"}`} 
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default function Inventories() {
  const { user, authFetch } = useAuth()
  
  // States
  const [activeTab, setActiveTab] = useState("stock") // "stock" or "warehouses"
  const [warehouses, setWarehouses] = useState([])
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [currentWarehouse, setCurrentWarehouse] = useState(null)
  
  // Form States
  const [warehouseForm, setWarehouseForm] = useState({ name: "", location: "", capacity: "" })
  const [stockForm, setStockForm] = useState({ product_id: "", warehouse_id: "", quantity: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [wRes, iRes, pRes] = await Promise.all([
        authFetch("/inventory/warehouses"),
        authFetch("/inventory"),
        authFetch("/products")
      ])
      if (wRes.ok) setWarehouses(await wRes.json())
      if (iRes.ok) setInventory(await iRes.json())
      if (pRes.ok) setProducts(await pRes.json())
    } catch (err) {
      console.error("Data fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault()
    const url = currentWarehouse ? `/inventory/warehouses/${currentWarehouse.id}` : "/inventory/warehouses"
    const method = currentWarehouse ? "PUT" : "POST"

    try {
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(warehouseForm)
      })
      if (res.ok) {
        setIsWarehouseModalOpen(false)
        fetchData()
      }
    } catch (err) { alert("Action failed") }
  }

  const handleStockSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await authFetch("/inventory", {
        method: "POST",
        body: JSON.stringify(stockForm)
      })
      if (res.ok) {
        setIsStockModalOpen(false)
        fetchData()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Stock update failed")
      }
    } catch (err) { alert("Network error. Please try again.") }
  }

  const openAddWarehouse = () => {
    setCurrentWarehouse(null)
    setWarehouseForm({ name: "", location: "", capacity: "" })
    setIsWarehouseModalOpen(true)
  }

  const openEditWarehouse = (w) => {
    setCurrentWarehouse(w)
    setWarehouseForm({ name: w.name, location: w.location, capacity: w.capacity })
    setIsWarehouseModalOpen(true)
  }

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm("Drop this warehouse? Records must be empty first.")) return
    try {
      const res = await authFetch(`/inventory/warehouses/${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
      else {
        const err = await res.json()
        alert(err.error)
      }
    } catch (err) { alert("Delete failed") }
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Inventory Control</h1>
          <p className="text-sm text-slate-400">Track and manage stock across multiple storage nodes.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={openAddWarehouse}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold text-sm transition-all"
          >
            <FiPlus /> New Warehouse
          </button>
          <button 
            onClick={() => setIsStockModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-all shadow-sm"
          >
            <FiLayers /> Update Stock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-black/[.05] dark:border-white/[.05] mb-6">
        <button 
          onClick={() => setActiveTab("stock")}
          className={`pb-3 text-sm font-bold transition-all px-1 flex items-center gap-2 ${activeTab === "stock" ? "border-b-2 border-sky-500 text-sky-500" : "text-slate-400 hover:text-slate-600"}`}
        >
          <FiBarChart2 /> Stock Tracking
        </button>
        <button 
          onClick={() => setActiveTab("warehouses")}
          className={`pb-3 text-sm font-bold transition-all px-1 flex items-center gap-2 ${activeTab === "warehouses" ? "border-b-2 border-sky-500 text-sky-500" : "text-slate-400 hover:text-slate-600"}`}
        >
          <FiHome /> Storage Hubs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sky-500 animate-pulse">
            <FiActivity size={40} />
          </div>
        ) : activeTab === "warehouses" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
            {warehouses.map(w => {
              const usage = inventory
                .filter(inv => inv.warehouse_id === w.id)
                .reduce((sum, item) => sum + item.quantity, 0)
              
              return (
                <WarehouseCard 
                  key={w.id} 
                  warehouse={w} 
                  usage={usage}
                  onEdit={openEditWarehouse} 
                  onDelete={() => handleDeleteWarehouse(w.id)} 
                />
              )
            })}
            {warehouses.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-black/[.05] dark:border-white/[.05] rounded-3xl">
                <FiHome className="mx-auto mb-4 text-slate-300" size={40} />
                <p className="text-slate-400">No warehouses configured in current system catalog.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {warehouses.map(warehouse => {
              const warehouseStock = inventory.filter(inv => inv.warehouse_id === warehouse.id)
              if (warehouseStock.length === 0) return null

              return (
                <div key={warehouse.id} className="bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-black/[.04] dark:border-white/[.06] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-black/[.02] dark:bg-white/[.02] border-b border-black/[.04] dark:border-white/[.06] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FiHome className="text-sky-500" size={18} />
                      <h3 className="font-bold text-slate-800 dark:text-white">{warehouse.name}</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full font-semibold">{warehouse.location}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{warehouseStock.length} Products</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-black/[.04] dark:border-white/[.06]">
                        <th className="px-6 py-3">Product Entity</th>
                        <th className="px-6 py-3">Quantity</th>
                        <th className="px-6 py-3 text-right">Last Synchronized</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[.02] dark:divide-white/[.02]">
                      {warehouseStock.map(inv => (
                        <tr key={inv.id} className="text-slate-600 dark:text-slate-300 hover:bg-black/[.01] dark:hover:bg-transparent/[.01] transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{inv.product_name}</td>
                          <td className="px-6 py-4 font-bold text-sky-500">{inv.quantity} {inv.uom_abbreviation}</td>
                          <td className="px-6 py-4 text-right text-[10px] text-slate-400">{new Date(inv.last_update).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })}
            {inventory.length === 0 && (
              <div className="bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-black/[.04] dark:border-white/[.06] p-12 text-center text-slate-400 italic">
                No active stock tracking records isolated.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL: WAREHOUSE FORM ─── */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-black/[.06] dark:border-white/[.08] w-full max-w-md rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/[.04]">
              <h2 className="font-bold flex items-center gap-2"><FiHome className="text-sky-500" /> {currentWarehouse ? "Modify Warehouse" : "New Warehouse"}</h2>
              <button onClick={() => setIsWarehouseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleWarehouseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Facility Name</label>
                <input required type="text" value={warehouseForm.name} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-main-bg dark:bg-main-dark-bg border border-black/[.05] focus:outline-none focus:border-sky-500 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Geographic Location</label>
                <input required type="text" value={warehouseForm.location} onChange={e => setWarehouseForm({...warehouseForm, location: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-main-bg dark:bg-main-dark-bg border border-black/[.05] focus:outline-none focus:border-sky-500 text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Max Capacity (Units)</label>
                <input required type="number" value={warehouseForm.capacity} onChange={e => setWarehouseForm({...warehouseForm, capacity: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-main-bg dark:bg-main-dark-bg border border-black/[.05] focus:outline-none focus:border-sky-500 text-slate-800 dark:text-white" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-sky-500 text-white font-bold text-sm shadow-md hover:bg-sky-600 transition-all">
                {currentWarehouse ? "Update Hub" : "Initialize Storage Node"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: STOCK LEVEL FORM ─── */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-box-bg dark:bg-box-dark-bg border border-black/[.06] dark:border-white/[.08] w-full max-w-md rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/[.04]">
              <h2 className="font-bold flex items-center gap-2"><FiLayers className="text-sky-500" /> Stock Level Management</h2>
              <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
            </div>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Target Product</label>
                <select required value={stockForm.product_id} onChange={e => setStockForm({...stockForm, product_id: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-main-bg dark:bg-main-dark-bg border border-black/[.05] focus:outline-none focus:border-sky-500 text-slate-800 dark:text-white">
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Storage Warehouse</label>
                <select required value={stockForm.warehouse_id} onChange={e => setStockForm({...stockForm, warehouse_id: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-main-bg dark:bg-main-dark-bg border border-black/[.05] focus:outline-none focus:border-sky-500 text-slate-800 dark:text-white">
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => {
                    const usage = inventory
                      .filter(inv => inv.warehouse_id === w.id)
                      .reduce((sum, item) => sum + item.quantity, 0)
                    const isFull = usage >= w.capacity
                    return (
                      <option key={w.id} value={w.id}>
                        {w.name} ({usage}/{w.capacity} units) {isFull ? "— FULL" : ""}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Total Unit Quantity</label>
                <input required type="number" min="0" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-main-bg dark:bg-main-dark-bg border border-black/[.05] focus:outline-none focus:border-sky-500 text-slate-800 dark:text-white" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-sky-500 text-white font-bold text-sm shadow-md hover:bg-sky-600 transition-all">
                Synchronize Stock Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
