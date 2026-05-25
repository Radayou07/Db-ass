import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FiUser, FiPhone, FiMail, FiLock, FiEye, FiEyeOff, FiMapPin } from "react-icons/fi"
import { MdInventory2 } from "react-icons/md"

export default function Register() {
  const [form, setForm] = useState({
    name: "", number: "", email: "", address: "", password: "", confirm: ""
  })
  const [showPass,  setShowPass]  = useState(false)
  const [error,     setError]     = useState("")
  const [loading,   setLoading]   = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (form.password && form.password !== form.confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await register({
        name:     form.name,
        number:   form.number,
        email:    form.email,
        address:  form.address,
        password: form.password
      })
      navigate("/login", { state: { registered: true, type: 'customer' } })
    } catch (err) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: "name",    label: "Full name",     type: "text",     icon: FiUser,   placeholder: "John Doe" },
    { id: "number",  label: "Phone number",  type: "tel",      icon: FiPhone,  placeholder: "+855 12 345 678" },
    { id: "email",   label: "Email address", type: "email",    icon: FiMail,   placeholder: "you@email.com" },
    { id: "address", label: "Home Address",  type: "text",     icon: FiMapPin, placeholder: "Street, City" },
  ]

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: "#0d2137" }}
      >
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

        <div>
          <h2 className="text-white text-3xl font-bold leading-tight">
            Join our<br />
            <span style={{ color: "#38bdf8" }}>Customer Network.</span>
          </h2>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed">
            Create an account to track your orders and manage your profile.
            <br/><br/>
            <span className="text-xs italic text-slate-500">Note: Staff must be enrolled by an administrator.</span>
          </p>
        </div>

        <p className="text-slate-600 text-xs">
          Inventory Control Management System
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#eef5fb]">
        <div className="w-full max-w-[400px]">

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-8">Customer registration</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ id, label, type, icon: Icon, placeholder }) => (
              <div key={id}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type={type}
                    value={form[id]}
                    onChange={set(id)}
                    placeholder={placeholder}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl
                               text-sm text-gray-900 placeholder-gray-400
                               focus:outline-none focus:ring-2 focus:border-transparent"
                  />
                </div>
              </div>
            ))}

            {/* Password (Optional for now in backend, but keep in UI) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-transparent border border-gray-200 rounded-xl
                             text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Re-enter password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-200 rounded-xl
                             text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
                         transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: "#0d2137" }}
            >
              {loading ? "Registering…" : "Register Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-medium hover:underline" style={{ color: "#0d2137" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
