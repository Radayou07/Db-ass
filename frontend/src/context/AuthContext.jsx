import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

const API = "http://localhost:5001/api"

// Decode the JWT payload without a library
function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem("token"))
  const [user,  setUser]    = useState(() => {
    const t = localStorage.getItem("token")
    if (!t) return null
    const p = parseToken(t)
    return p ? { id: p.sub, name: p.name, email: p.email, role: p.role } : null
  })

  // ── Login ──────────────────────────────────────────────
  const login = async (email, password) => {
    const res  = await fetch(`${API}/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) throw new Error(data.error || "Login failed")

    localStorage.setItem("token", data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  // ── Register ───────────────────────────────────────────
  const register = async (fields) => {
    const res  = await fetch(`${API}/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(fields),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Registration failed")
    return data
  }

  // ── Logout ─────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  // ── Helpers ────────────────────────────────────────────
  const isAuthenticated = !!token
  const isAdmin         = user?.role === "admin"

  // Attach token to every fetch automatically via a helper
  const authFetch = (url, options = {}) => {
    const isFormData = options.body instanceof FormData
    
    // Ensure url starts with /
    const cleanUrl = url.startsWith('/') ? url : `/${url}`
    const fullUrl = `${API}${cleanUrl}`

    console.log(`[authFetch] ${options.method || 'GET'} ${fullUrl}`)
    console.log(`[authFetch] Token present: ${!!token}`)
    
    const headers = {
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    }

    // Only set application/json if it's not FormData and not already set
    if (!isFormData && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    // For FormData, we must let the browser set the Content-Type with the boundary
    if (isFormData) {
      delete headers["Content-Type"]
    }

    return fetch(fullUrl, {
      ...options,
      headers,
    }).then(res => {
      if (res.status === 401) {
        console.error("[authFetch] 401 Unauthorized - Token might be expired or invalid")
      }
      return res
    })
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      register,
      authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — use this everywhere instead of useContext(AuthContext)
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
