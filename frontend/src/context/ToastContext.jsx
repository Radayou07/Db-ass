import { createContext, useContext, useState, useCallback } from "react"
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = "success") => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto-remove after 4 seconds
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-[1.25rem] shadow-2xl border
              animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-500 min-w-[320px] max-w-md
              backdrop-blur-xl transition-all
              ${t.type === "success" 
                ? "bg-white/90 dark:bg-slate-900/90 border-emerald-500/20 text-slate-800 dark:text-white ring-1 ring-emerald-500/10" 
                : "bg-white/90 dark:bg-slate-900/90 border-rose-500/20 text-slate-800 dark:text-white ring-1 ring-rose-500/10"}
            `}
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg
              ${t.type === "success" ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rose-500 text-white shadow-rose-500/20"}
            `}>
              {t.type === "success" ? <FiCheckCircle size={22} /> : <FiAlertCircle size={22} />}
            </div>
            
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5">
                  {t.type === "success" ? "System Success" : "Action Required"}
               </p>
               <p className="text-sm font-bold truncate leading-tight">{t.message}</p>
            </div>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90"
            >
              <FiX size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return ctx
}
