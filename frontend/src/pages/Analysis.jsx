import { useEffect, useMemo, useState } from "react"
import { FiActivity, FiBarChart2, FiDollarSign, FiShoppingBag, FiTrendingUp } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

function money(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function SalesPurchaseChart({ data }) {
  const W = 820
  const H = 320
  const pad = { top: 24, right: 28, bottom: 44, left: 72 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom
  const maxValue = Math.max(...data.flatMap(item => [item.sales || 0, item.purchases || 0]), 1)
  const slot = chartW / Math.max(data.length, 1)
  const barW = Math.min(34, slot * 0.25)

  const y = value => pad.top + chartH * (1 - (value || 0) / maxValue)

  return (
    <svg className="w-full h-full min-h-[320px]" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map(tick => {
        const value = maxValue * tick
        const lineY = y(value)
        return (
          <g key={tick}>
            <line x1={pad.left} y1={lineY} x2={W - pad.right} y2={lineY} stroke="currentColor" strokeOpacity="0.08" />
            <text x={pad.left - 12} y={lineY + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
              ${Math.round(value).toLocaleString()}
            </text>
          </g>
        )
      })}

      {data.map((item, idx) => {
        const center = pad.left + slot * idx + slot / 2
        const salesY = y(item.sales)
        const purchaseY = y(item.purchases)
        const baseY = pad.top + chartH
        return (
          <g key={`${item.month}-${idx}`}>
            <rect x={center - barW - 3} y={salesY} width={barW} height={baseY - salesY} rx="6" fill="#0ea5e9" />
            <rect x={center + 3} y={purchaseY} width={barW} height={baseY - purchaseY} rx="6" fill="#f97316" />
            <text x={center} y={H - 16} textAnchor="middle" fontSize="12" fill="#94a3b8" fontWeight="700">
              {item.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">${value}</p>
      </div>
    </div>
  )
}

export default function Analysis() {
  const { authFetch } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await authFetch("/dashboard/sales-vs-purchases")
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totals = useMemo(() => {
    const sales = data.reduce((sum, item) => sum + Number(item.sales || 0), 0)
    const purchases = data.reduce((sum, item) => sum + Number(item.purchases || 0), 0)
    return { sales, purchases, net: sales - purchases }
  }, [data])

  if (loading) {
    return (
      <div className="h-screen bg-main-bg dark:bg-main-dark-bg flex items-center justify-center text-sky-500">
        <FiActivity className="animate-spin" size={42} />
      </div>
    )
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border rounded-[2rem] p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Analysis</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Sales vs purchases</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center">
            <FiBarChart2 size={24} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Stat icon={FiDollarSign} label="Sales" value={money(totals.sales)} color="bg-sky-50 dark:bg-sky-900/20 text-sky-500" />
          <Stat icon={FiShoppingBag} label="Purchases" value={money(totals.purchases)} color="bg-orange-50 dark:bg-orange-900/20 text-orange-500" />
          <Stat icon={FiTrendingUp} label="Net" value={money(totals.net)} color={totals.net >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" : "bg-rose-50 dark:bg-rose-900/20 text-rose-500"} />
        </div>

        <div className="bg-box-bg dark:bg-box-dark-bg border border-box-border dark:border-box-dark-border rounded-[2rem] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Monthly Comparison</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Last 6 months</p>
            </div>
            <div className="flex gap-4 text-xs font-black uppercase tracking-widest">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-300"><i className="w-3 h-3 rounded bg-sky-500" /> Sales</span>
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-300"><i className="w-3 h-3 rounded bg-orange-500" /> Purchases</span>
            </div>
          </div>

          {data.length === 0 ? (
            <div className="py-24 text-center text-sm font-black text-slate-300 uppercase tracking-widest">No sales or purchase data yet</div>
          ) : (
            <SalesPurchaseChart data={data} />
          )}
        </div>
      </div>
    </div>
  )
}
