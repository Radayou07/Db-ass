import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi"
import { MdInventory2 } from "react-icons/md"

export default function Login() {
  const [email,       setEmail]       = useState("")
  const [password,    setPassword]    = useState("")
  const [showPass,    setShowPass]    = useState(false)
  const [error,       setError]       = useState("")
  const [loading,     setLoading]     = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const user = await login(email, password)
      
      // If staff/admin, redirect to the external admin site
      if (user?.role === "admin" || user?.role === "staff") {
        const adminUrl = import.meta.env.VITE_ADMIN_URL
        if (adminUrl) {
          window.location.href = adminUrl
        } else {
          // If no admin URL is set, just let them in but they might want to know
          navigate("/")
        }
      } else {
        navigate("/")
      }
    } catch (err) {
      setError(err.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "#0d2137" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#38bdf8" }}
          >
            <MdInventory2 className="text-white text-lg" />
          </div>
          <span className="text-white font-semibold tracking-wide text-sm">
            <span style={{ color: "#38bdf8" }}>Inv</span>entory
          </span>
        </div>

        {/* Tagline */}
        <div>
          <h2 className="text-white text-3xl font-bold leading-tight">
            Shop the best,<br />
            <span style={{ color: "#38bdf8" }}>delivered to your door.</span>
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed">
            Premium products and exceptional service for our valued customers.
          </p>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs">
          Inventory Control Management System
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#eef5fb]">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#0d2137" }}
            >
              <MdInventory2 className="text-white text-lg" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">
              Customer Portal
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your customer account</p>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email/Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com or 012345678"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl text-sm
                             text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "#38bdf8" }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-transparent border border-gray-200 rounded-xl text-sm
                             text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": "#38bdf8" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
                         transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: loading ? "#0d2137" : "#0d2137" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1a3a5c" }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#0d2137" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            No account yet?{" "}
            <Link
              to="/register"
              className="font-medium hover:underline"
              style={{ color: "#0d2137" }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
