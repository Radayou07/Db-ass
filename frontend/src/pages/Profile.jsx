import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/AuthContext"
import { useToast } from "../context/ToastContext"
import { FiUser, FiMail, FiPhone, FiEdit3, FiCheck, FiX, FiInfo, FiCamera, FiLoader } from "react-icons/fi"

export default function Profile() {
  const { user, authFetch, updateUser, resolveImageUrl } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        number: user.number || "",
        description: user.description || ""
      })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        const data = await res.json()
        updateUser(data.user)
        toast("Profile identity updated successfully")
        setIsEditing(false)
      } else {
        toast("Failed to update profile", "error")
      }
    } catch (err) {
      toast("Identity update failed due to network error", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)

    setUploading(true)
    try {
      const res = await authFetch("/auth/profile/image", {
        method: "POST",
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        updateUser(data.user)
        toast("Identity photo synchronized to cloud storage")
      } else {
        const err = await res.json()
        toast(err.error || "Image upload synchronization failed", "error")
      }
    } catch (err) {
      toast("Cloud storage connection timeout", "error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-screen p-6 bg-main-bg dark:bg-main-dark-bg text-slate-700 dark:text-slate-200 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <FiUser className="text-sky-500" /> My Personal Identity
          </h1>
          <p className="text-sm text-slate-400">View and manage your professional profile and system credentials.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar / Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-black/[.04] dark:border-white/[.06] p-6 text-center shadow-sm">
              <div 
                className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer"
                onClick={handleImageClick}
              >
                {user?.image_url ? (
                  <img
                    src={resolveImageUrl(user.image_url)}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover shadow-lg border-2 border-sky-500/20"
                  />
                ) : (

                  <div className="w-full h-full bg-sky-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-sky-500/20">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {uploading ? (
                    <FiLoader className="text-white animate-spin text-xl" />
                  ) : (
                    <FiCamera className="text-white text-xl" />
                  )}
                </div>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{user?.name}</h2>
              <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mt-1">{user?.role}</p>
              <div className="mt-6 pt-6 border-t border-black/[.04] dark:border-white/[.06] space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <FiMail className="text-slate-400 shrink-0" />
                  <span className="truncate text-slate-600 dark:text-slate-300">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FiPhone className="text-slate-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">{user?.number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-box-bg dark:bg-box-dark-bg rounded-2xl border border-black/[.04] dark:border-white/[.06] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiInfo className="text-sky-500" /> Professional Details
                </h3>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-white text-xs font-bold transition-all"
                  >
                    <FiEdit3 /> Edit Profile
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Full Identity</label>
                      <input 
                        required 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Contact Number</label>
                      <input 
                        required 
                        type="tel" 
                        value={formData.number}
                        onChange={e => setFormData({...formData, number: e.target.value})}
                        className="w-full px-4 py-2.5 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Personal Description / Bio</label>
                    <textarea 
                      rows="4"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Share a brief overview of your role or background..."
                      className="w-full px-4 py-2.5 bg-main-bg dark:bg-main-dark-bg rounded-xl border border-black/[.05] focus:outline-none focus:border-sky-500 text-sm resize-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <FiX /> Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-500/20 hover:bg-sky-600 transition-all disabled:opacity-50"
                    >
                      <FiCheck /> {loading ? "Saving..." : "Save Identity"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase mb-1 ml-1">Full Identity</span>
                      <p className="text-slate-800 dark:text-white font-medium px-1">{user?.name || "—"}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase mb-1 ml-1">Contact Number</span>
                      <p className="text-slate-800 dark:text-white font-medium px-1">{user?.number || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase mb-2 ml-1">Personal Description</span>
                    <div className="bg-black/[.02] dark:bg-white/[.02] rounded-2xl p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border border-black/[.01] dark:border-white/[.01]">
                      {user?.description || "No professional description has been provided for this identity node."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
