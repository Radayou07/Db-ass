import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { IoMdHome, IoMdPeople } from "react-icons/io"
import { MdShoppingCart, MdAnalytics } from "react-icons/md"
import { GiShoppingBag } from "react-icons/gi"
import { FaHandsHelping } from "react-icons/fa"
import { IoHelp } from "react-icons/io5"
import { RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri"
import DarkMode from "./DarkMode"

const NAV = [
  { to: "/",          Icon: IoMdHome,       label: "Home" },
  { to: "/product",   Icon: MdShoppingCart, label: "Products" },
  { to: "/order",     Icon: GiShoppingBag,  label: "Orders" },
  { to: "/customer",  Icon: IoMdPeople,     label: "Customers" },
  { to: "/supplier",  Icon: FaHandsHelping, label: "Suppliers" },
  { to: "/analysis",  Icon: MdAnalytics,    label: "Analysis" },
  { to: "/about",     Icon: IoHelp,         label: "About" },
]

export default function SideBar({ isDark, setIsDark }) {
  const [isOpen, setIsOpen] = useState(true)
  const { pathname } = useLocation()

  return (
    <aside
      className={`
        flex flex-col shrink-0 h-screen
        bg-slider-bg dark:bg-slider-dark-bg
        border-r border-white/5
        overflow-hidden
        /* Use no-color-transition so width animates fast, not slow like color */
        transition-[width] duration-300 ease-in-out
        ${isOpen ? "w-60" : "w-[68px]"}
      `}
    >
      {/* ── Brand + toggle ── */}
      <div className={`
        flex items-center h-16 px-4 shrink-0 border-b border-white/5
        ${isOpen ? "justify-between" : "justify-center"}
      `}>
        {isOpen && (
          <span className="text-white font-semibold tracking-wide text-sm select-none">
            <span className="text-side-icon">Inv</span>entory
          </span>
        )}
        <button
          onClick={() => setIsOpen(o => !o)}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-150"
        >
          {isOpen
            ? <RiMenuFoldLine  size={20} />
            : <RiMenuUnfoldLine size={20} />
          }
        </button>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ to, Icon, label }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              title={!isOpen ? label : undefined}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium whitespace-nowrap
                transition-colors duration-150 group
                ${active
                  ? "bg-white/10 text-white"
                  : "text-side-text hover:bg-white/[.06] hover:text-white"
                }
              `}
            >
              {/* Left accent bar for active item */}
              <span className={`
                absolute left-0 top-1/2 -translate-y-1/2
                w-0.5 h-5 rounded-r-full bg-side-icon
                transition-opacity duration-200
                ${active ? "opacity-100" : "opacity-0"}
              `} />

              <Icon className={`
                shrink-0 w-5 h-5 transition-colors duration-150
                ${active ? "text-side-icon" : "text-slate-500 group-hover:text-side-icon"}
              `} />

              {/* Text slides in/out with sidebar width */}
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

      {/* ── Dark mode toggle ── */}
      <div className={`
        px-4 py-4 shrink-0 border-t border-white/5
        flex items-center gap-3
        ${isOpen ? "justify-between" : "justify-center"}
      `}>
        {isOpen && (
          <span className="text-xs text-slate-500 select-none">
            {isDark ? "Dark" : "Light"} mode
          </span>
        )}
        <DarkMode isDark={isDark} setIsDark={setIsDark} />
      </div>
    </aside>
  )
}