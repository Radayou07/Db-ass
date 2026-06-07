import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { IoMdHome, IoMdPeople } from "react-icons/io"
import { MdShoppingCart, MdAnalytics, MdInventory2 } from "react-icons/md"
import { GiShoppingBag } from "react-icons/gi"
import { FaHandsHelping } from "react-icons/fa"
import { RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri"
import { FiLogOut, FiShield, FiUser, FiTag, FiExternalLink, FiCheck, FiLayout } from "react-icons/fi"
import { BsBoxSeam } from "react-icons/bs"
import DarkMode from "./DarkMode"
import { useAuth } from "../context/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import axios from "axios"

const ADMIN_NAV = [
  { to: "/staff",          Icon: IoMdHome,       label: "Home" },
  { to: "/staff/products",   Icon: MdShoppingCart, label: "Products" },
  { to: "/staff/inventories", Icon: BsBoxSeam,      label: "Inventory" },
  { to: "/staff/orders",     Icon: GiShoppingBag,  label: "Orders" },
  { to: "/staff/customers",  Icon: IoMdPeople,     label: "Customers" },
  { to: "/staff/suppliers",  Icon: FaHandsHelping, label: "Suppliers" },
  { to: "/staff/approvals",  Icon: FiCheck,        label: "Approvals" },
  { to: "/staff/brands",     Icon: FiTag,          label: "Brands" },
  { to: "/staff/discounts",  Icon: FiTag,          label: "Discounts" },
  { to: "/staff/storefront", Icon: FiLayout,       label: "Storefront" },
  { to: "/staff/analysis",  Icon: MdAnalytics,    label: "Analysis" },
]

// Get initials from a name e.g. "John Doe" → "JD"
function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

export default function SideBar({ isDark, setIsDark }) {
  const [isOpen, setIsOpen] = useState(true)
  const { pathname }        = useLocation()
  const { user, isAdmin, logout, resolveImageUrl } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const prefetch = (key, url) => {
    queryClient.prefetchQuery({
      queryKey: [key],
      queryFn: () => axios.get(url).then(res => res.data)
    })
  }

  // Admin menu selection
  let menu = [...ADMIN_NAV]
  
  if (isAdmin) {
    menu.push({ to: "/staff/staff", Icon: FiShield, label: "Staff" })
  }

  return (
    <aside
      className={`
        flex flex-col shrink-0 h-screen
        bg-slider-bg dark:bg-slider-dark-bg
        border-r border-slate-200 dark:border-white/5
        overflow-hidden
        transition-[width] duration-300 ease-in-out
        ${isOpen ? "w-48" : "w-[64px]"}
      `}
    >
      {/* ── Brand + toggle ── */}
      <div className={`
        flex items-center h-16 px-4 shrink-0 border-b border-slate-200 dark:border-white/5
        ${isOpen ? "justify-between" : "justify-center"}
      `}>
        {isOpen && (
          <div className="flex items-center gap-2">
            <MdInventory2 className="text-side-icon text-lg" />
            <span className="text-slate-900 dark:text-white font-semibold tracking-wide text-sm select-none">
              <span className="text-side-icon">Inv</span>entory
            </span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(o => !o)}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors duration-150"
        >
          {isOpen ? <RiMenuFoldLine size={20} /> : <RiMenuUnfoldLine size={20} />}
        </button>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {menu.map(({ to, Icon, label }) => {
          const active = pathname === to
          const queryKeyMap = {
            "/staff/products": "products",
            "/staff/suppliers": "suppliers",
            "/staff/customers": "customers",
            "/staff/orders": "orders",
            "/staff/inventories": "inventory",
            "/staff/staff": "staff",
            "/staff/brands": "brands",
            "/staff/discounts": "discounts"
          }
          const endpointMap = {
            "/staff/products": "/products",
            "/staff/suppliers": "/suppliers",
            "/staff/customers": "/customers",
            "/staff/orders": "/orders",
            "/staff/inventories": "/inventory/warehouses",
            "/staff/staff": "/auth/staff",
            "/staff/brands": "/brands",
            "/staff/discounts": "/discount"
          }

          return (
            <Link
              key={to}
              to={to}
              onMouseEnter={() => queryKeyMap[to] && prefetch(queryKeyMap[to], endpointMap[to])}
              title={!isOpen ? label : undefined}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium whitespace-nowrap
                transition-colors duration-150 group
                ${active
                  ? "bg-sky-50 dark:bg-white/10 text-sky-600 dark:text-white"
                  : "text-side-text hover:bg-slate-100 dark:hover:bg-white/[.06] hover:text-slate-900 dark:hover:text-white"
                }
              `}
            >
              <span className={`
                absolute left-0 top-1/2 -translate-y-1/2
                w-0.5 h-5 rounded-r-full bg-side-icon
                transition-opacity duration-200
                ${active ? "opacity-100" : "opacity-0"}
              `} />

              <Icon className={`
                shrink-0 w-5 h-5 transition-colors duration-150
                ${active ? "text-side-icon" : "text-slate-400 group-hover:text-side-icon"}
              `} />

              <span className={`
                overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out
                ${isOpen ? "max-w-xs opacity-100" : "max-w-0 opacity-0"}
              `}>
                {label}
              </span>
            </Link>
          )
        })}

      </nav>

      {/* ── User info + logout ── */}
      <div className="shrink-0 border-t border-slate-200 dark:border-white/5 px-2 py-3 space-y-1">
        <Link
          to="/staff/profile"
          title={!isOpen ? "Profile" : undefined}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-xl
            hover:bg-slate-100 dark:hover:bg-white/[.06] transition-colors duration-150
            ${isOpen ? "" : "justify-center"}
          `}
        >
          {user?.image_url ? (
            <img 
              src={resolveImageUrl(user.image_url)} 
              alt={user.name} 
              className="shrink-0 w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
            />
          ) : (
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#38bdf8" }}
            >
              {initials(user?.name)}
            </div>
          )}

          <div className={`
            overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out min-w-0
            ${isOpen ? "max-w-xs opacity-100" : "max-w-0 opacity-0"}
          `}>
            <p className="text-slate-900 dark:text-white text-xs font-medium truncate leading-tight">
              {user?.name || "—"}
            </p>
            <span className={`
              text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase
              ${isAdmin
                ? "bg-sky-500/20 text-sky-500"
                : "bg-slate-500/20 text-slate-500"
              }
            `}>
              {user?.role || "staff"}
            </span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          title={!isOpen ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-sm font-medium text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[.06]
                     transition-colors duration-150"
        >
          <FiLogOut className="shrink-0 w-5 h-5" />
          <span className={`
            overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out whitespace-nowrap
            ${isOpen ? "max-w-xs opacity-100" : "max-w-0 opacity-0"}
          `}>
            Logout
          </span>
        </button>

        <div className={`
          px-3 py-2 flex items-center gap-3
          ${isOpen ? "justify-between" : "justify-center"}
        `}>
          {isOpen && (
            <span className="text-xs text-slate-500 select-none">
              {isDark ? "Dark" : "Light"} mode
            </span>
          )}
          <DarkMode isDark={isDark} setIsDark={setIsDark} />
        </div>
      </div>
    </aside>
  )
}
