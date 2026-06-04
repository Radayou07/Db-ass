import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FiBox, FiShoppingCart, FiLayers, FiAlertTriangle, FiActivity, FiUsers, FiPackage, FiShoppingBag, FiTag } from "react-icons/fi"

/* ─── Tiny donut chart ─── */
function DonutChart({ data, size = 130 }) {
  if (!data || data.length === 0) return null
  const cx = size / 2, cy = size / 2
  const r = size * 0.38, ir = size * 0.25
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  if (total === 0) return <div className="text-[10px] text-slate-400">No data</div>
  
  let cum = -90
  const toRad = a => (a * Math.PI) / 180

  const slices = data.map(d => {
    const angle = (d.value / total) * 360
    const s = cum, e = cum + angle
    cum = e
    const large = angle > 180 ? 1 : 0
    const pts = (radius, a) => [cx + radius * Math.cos(toRad(a)), cy + radius * Math.sin(toRad(a))]
    const [x1, y1] = pts(r,  s), [x2, y2] = pts(r,  e)
    const [xi1, yi1] = pts(ir, s), [xi2, yi2] = pts(ir, e)
    return {
      ...d,
      path: `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${xi2} ${yi2} A${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1}Z`
    }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8.5" fill="#94a3b8">Total</text>
    </svg>
  )
}

/* ─── Time series line chart ─── */
function TimeSeriesChart({ data }) {
  if (!data || data.length === 0) return null
  const W = 460, H = 170
  const pad = { top: 12, right: 12, bottom: 28, left: 38 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom
  const max = Math.max(...data.flatMap(d => [d.income || 0, d.outcome || 0])) || 1
  
  const getX = (i) => pad.left + (i / (data.length - 1)) * cW
  const getY = (value) => pad.top + cH * (1 - value / max)
  
  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income || 0)}`).join(" ")
  const outcomePoints = data.map((d, i) => `${getX(i)},${getY(d.outcome || 0)}`).join(" ")
  
  const incomeArea = `M${incomePoints} ${getX(data.length - 1)},${pad.top + cH} ${getX(0)},${pad.top + cH} Z`
  const outcomeArea = `M${outcomePoints} ${getX(data.length - 1)},${pad.top + cH} ${getX(0)},${pad.top + cH} Z`

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = pad.top + cH * (1 - t)
        return (
          <g key={t}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
            <text x={pad.left - 5} y={y + 3.5} textAnchor="end" fontSize="8" fill="#94a3b8">
              {t === 0 ? "0" : `${Math.round(max * t / 1000)}k`}
            </text>
          </g>
        )
      })}
      <path d={incomeArea} fill="#38bdf8" fillOpacity="0.1" />
      <path d={outcomeArea} fill="#f97316" fillOpacity="0.1" />
      <polyline points={incomePoints} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={outcomePoints} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={getX(i)} cy={getY(d.income || 0)} r="3.5" fill="#38bdf8" stroke="white" strokeWidth="1.5" />
          <circle cx={getX(i)} cy={getY(d.outcome || 0)} r="3.5" fill="#f97316" stroke="white" strokeWidth="1.5" />
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={getX(i)} y={H - 7} textAnchor="middle" fontSize="8.5" fill="#94a3b8">{d.month}</text>
      ))}
    </svg>
  )
}

/* Card wrapper */
function Card({ children, className = "" }) {
  return (
    <div className={`bg-box-bg dark:bg-box-dark-bg rounded-xl shadow-sm border border-black/[.04] dark:border-white/[.06] ${className}`}>
      {children}
    </div>
  )
}

const AVATAR_COLORS = ["bg-sky-500", "bg-violet-500", "bg-teal-500", "bg-orange-400"]

export default function Home() {
  const { authFetch, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await authFetch("/dashboard/stats")
      if (res.ok) setStats(await res.json())
    } catch (err) {
      console.error("Fetch stats failed", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-sky-500 animate-pulse">
      <FiActivity size={40} />
    </div>
  )

  const counts = stats?.counts || {}
  const topProducts = stats?.top_products || []
  const topCustomers = stats?.top_customers || []

  const STAT_CARDS = [
    { label: "Products", value: counts.products?.toLocaleString(), sub: "In your store", Icon: FiBox,          card: "border-box-border bg-box-border-bg", icon: "text-blue-400 bg-blue-50 dark:bg-blue-950/40" },
    { label: "Orders",   value: counts.orders?.toLocaleString(),   sub: "Customer sales",      Icon: FiShoppingCart,  card: "border-box-border bg-box-border-bg", icon: "text-sky-400  bg-sky-50  dark:bg-sky-950/40"  },
    { label: "Total Stock",value: counts.total_stock?.toLocaleString(),sub: "Units available",   Icon: FiLayers,       card: "border-box-border bg-box-border-bg", icon: "text-teal-400 bg-teal-50 dark:bg-teal-950/40" },
    { label: "Low Stock", value: counts.out_of_stock?.toLocaleString(),sub: "Needs restocking",Icon: FiAlertTriangle, card: "border-box-border-warn bg-box-border-warn-bg", icon: "text-orange-400 bg-orange-50 dark:bg-orange-950/40" },
  ]

  const PIE_DATA = [
    { label: "In Stock", value: counts.total_stock || 0, color: "#38bdf8" },
    { label: "Out of Stock", value: counts.out_of_stock || 0, color: "#f97316" },
  ]

  return (
    <div className="h-screen p-5 flex flex-col gap-5 text-slate-700 dark:text-slate-100 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Store Dashboard</h1>
          <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Quick overview of your business.</p>
        </div>
      </div>

      <div className="grid grid-cols-5 grid-rows-6 gap-4 flex-1 min-h-0">
        {/* Stats row */}
        <div className="col-span-5 row-span-1 grid grid-cols-4 gap-3">
          {STAT_CARDS.map(({ label, value, sub, Icon, card, icon }) => (
            <Card key={label} className={`flex items-center gap-4 p-4 border-2 ${card}`}>
              <span className={`p-2.5 rounded-xl ${icon}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 dark:text-slate-300 font-medium uppercase tracking-wide truncate">{label}</p>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-0.5 truncate">{sub}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Top customers */}
        <Card className="col-span-1 row-span-2 row-start-2 p-4 flex flex-col gap-3 overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2"><FiUsers/> Top Customers</p>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % 4]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {c.name.substring(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-300">{c.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Donut chart */}
        <Card className="col-span-2 row-span-2 row-start-2 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wide">Stock Overview</p>
          <div className="flex-1 flex items-center justify-around">
            <DonutChart data={PIE_DATA} size={120} />
            <div className="flex flex-col gap-2">
              {PIE_DATA.map(d => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-slate-500 dark:text-slate-300">{d.label}</span>
                  <span className="font-semibold ml-auto pl-3">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top 10 Products */}
        <Card className="col-span-2 row-span-5 col-start-4 row-start-2 p-4 flex flex-col gap-3 overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wide">Best Selling Products</p>
          <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-500 w-4">#{i + 1}</span>
                    <span className="font-medium truncate max-w-[140px]">{p.name}</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-300 shrink-0">{p.sold} sold</span>
                </div>
                <div className="h-1 rounded-full bg-transparent dark:bg-transparent/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-[width] duration-500"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Time series placeholder */}
        <Card className="col-span-3 row-span-3 row-start-4 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wide">Purchases vs Sales</p>
            <p className="text-[8px] text-slate-400 dark:text-slate-300 italic font-mono uppercase tracking-widest">Projection Data Only</p>
          </div>
          <div className="flex-1 flex items-center min-h-0 opacity-40 grayscale">
            <TimeSeriesChart data={[
              { month: "Jan", income: 42, outcome: 28 }, { month: "Feb", income: 55, outcome: 31 },
              { month: "Mar", income: 38, outcome: 25 }, { month: "Apr", income: 67, outcome: 42 },
              { month: "May", income: 71, outcome: 38 }, { month: "Jun", income: 59, outcome: 35 },
            ]} />
          </div>
        </Card>
      </div>
    </div>
  )
}
