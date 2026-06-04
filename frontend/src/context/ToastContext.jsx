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
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border
              animate-in slide-in-from-right fade-in duration-300 min-w-[300px]
              ${t.type === "success" 
                ? "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 text-slate-800 dark:text-white" 
                : "bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/30 text-slate-800 dark:text-white"}
            `}
          >
            <span className={t.type === "success" ? "text-emerald-500" : "text-rose-500"}>
              {t.type === "success" ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
            </span>
            
            <p className="flex-1 text-sm font-bold">{t.message}</p>
            
            <button 
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <FiX size={16} />
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
