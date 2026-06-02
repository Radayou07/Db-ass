

import { MdDarkMode, MdLightMode } from "react-icons/md";

export default function DarkMode({ isDark, setIsDark }) {
  return (
    <button
      onClick={() => setIsDark(d => !d)}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
      className={`
        relative flex-shrink-0 w-11 h-6 rounded-full
        transition-colors duration-300
        ${isDark ? "bg-sky-500" : "bg-slate-600/60"}
      `}
    >
      {/* Sliding thumb */}
      <span className={`
        absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md
        flex items-center justify-center text-[12px]
        transition-[left] duration-300 ease-in-out
        ${isDark ? "left-[22px]" : "left-0.5"}
      `}>
        {isDark ? <MdDarkMode className="text-slate-800" /> : <MdLightMode className="text-amber-500" />}
      </span>
    </button>
  )
}