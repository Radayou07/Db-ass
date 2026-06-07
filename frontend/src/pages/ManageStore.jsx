import React, { useState, useEffect } from 'react'
import { FiLayout, FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiActivity, FiImage, FiExternalLink, FiChevronUp, FiChevronDown, FiUploadCloud, FiLoader, FiSearch, FiPlusCircle, FiPackage, FiTag } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ManageStore() {
  const { authFetch, resolveImageUrl } = useAuth()
  const { toast } = useToast()
  
  const [banners, setBanners] = useState([])
  const [products, setProducts] = useState([])
  const [config, setConfig] = useState({
    side_promo_title: 'Huge Sale',
    side_promo_subtitle: '70% OFF',
    side_promo_link: '/customer/products'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Product Picker State
  const [pickerTarget, setPickerTarget] = useState(null) // 'banner' or 'config'
  const [pickerSearch, setPickerSearch] = useState("")

  // Modal/Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title_text: '',
    subtitle_text: '',
    image_url: '',
    link_url: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [bannersRes, productsRes, configRes] = await Promise.all([
        authFetch('/storefront/banners/all'),
        authFetch('/products'),
        authFetch('/storefront/config')
      ])
      if (bannersRes.ok) setBanners(await bannersRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
      if (configRes.ok) setConfig(await configRes.json())
    } catch (err) {
      console.error(err)
      toast("Failed to load store data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      const res = await authFetch('/storefront/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      })
      if (res.ok) {
        toast("Sidebar promotion updated")
      }
    } catch (err) {
      toast("Failed to update config", "error")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleConfigImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const uploadFormData = new FormData()
    uploadFormData.append('images', file)

    setIsUploading(true)
    try {
      const res = await authFetch('/upload', { method: 'POST', body: uploadFormData })
      if (res.ok) {
        const { urls } = await res.json()
        setConfig(prev => ({ ...prev, side_promo_image_url: urls[0] }))
        toast("Promo image uploaded")
      }
    } catch (err) {
      console.error(err)
      toast("Upload failed", "error")
    } finally {
      setIsUploading(false)
    }
  }

  async function fetchBanners() {
    try {
      const res = await authFetch('/storefront/banners/all')
      if (res.ok) setBanners(await res.json())
    } catch (err) {}
  }

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({ ...banner })
    } else {
      setEditingBanner(null)
      setFormData({
        title_text: '',
        subtitle_text: '',
        image_url: '',
        link_url: '',
        display_order: banners.length,
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const uploadFormData = new FormData()
    uploadFormData.append('images', file)

    setIsUploading(true)
    try {
      const res = await authFetch('/upload', { method: 'POST', body: uploadFormData })
      if (res.ok) {
        const { urls } = await res.json()
        setFormData(prev => ({ ...prev, image_url: urls[0] }))
        toast("Image uploaded successfully")
      }
    } catch (err) {
      console.error(err)
      toast("Upload failed", "error")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.image_url) return toast("Image is required", "error")

    setSaving(true)
    try {
      const url = editingBanner ? `/storefront/banners/${editingBanner.id}` : '/storefront/banners'
      const method = editingBanner ? 'PUT' : 'POST'
      
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast(editingBanner ? "Banner updated" : "Banner created")
        setIsModalOpen(false)
        fetchBanners()
      } else {
        const err = await res.json()
        toast(err.error || "Action failed", "error")
      }
    } catch (err) {
      toast("Network error", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return
    try {
      const res = await authFetch(`/storefront/banners/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast("Banner removed")
        fetchBanners()
      }
    } catch (err) {
      toast("Delete failed", "error")
    }
  }

  const toggleStatus = async (banner) => {
    try {
      const res = await authFetch(`/storefront/banners/${banner.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !banner.is_active })
      })
      if (res.ok) fetchBanners()
    } catch (err) {}
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg flex flex-col overflow-hidden">
      <div className="p-5 flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Manage Storefront</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure customer homepage banners and carousel</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95"
          >
            <FiPlus size={18}/> Add New Banner
          </button>
        </div>

        {/* Banner List */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 overflow-hidden">
          
          {/* Main List */}
          <div className="flex flex-col bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] border border-box-border dark:border-box-dark-border overflow-hidden shadow-sm">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Carousel Slides</h2>
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <FiActivity size={40} className="animate-spin text-sky-500 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading Storefront Config...</p>
                </div>
              ) : banners.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-200 mb-4">
                    <FiLayout size={40} />
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase">No Banners Configured</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Add your first promotional slide to get started</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {banners.map(banner => (
                    <div key={banner.id} className="group rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 flex flex-col lg:flex-row items-center gap-8 hover:border-sky-200 dark:hover:border-sky-900/50 transition-all shadow-sm">
                      {/* Preview Image */}
                      <div className="w-full lg:w-48 h-24 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 shadow-inner">
                        <img src={resolveImageUrl(banner.image_url)} alt={banner.title_text} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            banner.is_active 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:border-emerald-900/30' 
                              : 'bg-slate-50 text-slate-400 border-slate-100 dark:bg-slate-950 dark:border-slate-800'
                          }`}>
                            {banner.is_active ? 'Active' : 'Hidden'}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Order: {banner.display_order}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{banner.title_text || "Untitled Banner"}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 line-clamp-1">{banner.subtitle_text || "No subtitle"}</p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button 
                          onClick={() => toggleStatus(banner)}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            banner.is_active 
                              ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-amber-500' 
                              : 'bg-emerald-500 border-emerald-500 text-white'
                          }`}
                          title={banner.is_active ? "Hide Banner" : "Show Banner"}
                        >
                          <FiActivity size={18}/>
                        </button>
                        <button 
                          onClick={() => handleOpenModal(banner)}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-sky-500 transition-all"
                        >
                          <FiEdit2 size={18}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(banner.id)}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition-all"
                        >
                          <FiTrash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="bg-box-bg dark:bg-box-dark-bg rounded-[2.5rem] border border-box-border dark:border-box-dark-border p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                     <FiTag size={20}/>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Sidebar Promo</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global static promotion</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Promo Image</label>
                     <div className="relative aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
                        {config.side_promo_image_url ? (
                          <>
                            <img src={resolveImageUrl(config.side_promo_image_url)} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <label className="cursor-pointer p-3 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all">
                                  <FiUploadCloud size={20}/>
                                  <input type="file" onChange={handleConfigImageUpload} className="hidden" accept="image/*" />
                               </label>
                            </div>
                          </>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2 p-6 text-slate-300 hover:text-sky-500 transition-colors">
                             {isUploading ? <FiLoader className="animate-spin" size={24}/> : <FiUploadCloud size={24}/>}
                             <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? "Uploading..." : "Upload Promo Image"}</span>
                             <input type="file" onChange={handleConfigImageUpload} className="hidden" accept="image/*" />
                          </label>
                        )}
                     </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Title</label>
                    <input 
                      type="text" 
                      value={config.side_promo_title}
                      onChange={e => setConfig({...config, side_promo_title: e.target.value})}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtext / Discount</label>
                    <input 
                      type="text" 
                      value={config.side_promo_subtitle}
                      onChange={e => setConfig({...config, side_promo_subtitle: e.target.value})}
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1 ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Link</label>
                      <button 
                        onClick={() => setPickerTarget(pickerTarget === 'config' ? null : 'config')}
                        className="text-[9px] font-black text-sky-500 hover:text-sky-600 uppercase tracking-widest"
                      >
                        {pickerTarget === 'config' ? 'Close' : 'Select Product'}
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={config.side_promo_link}
                      onChange={e => setConfig({...config, side_promo_link: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all"
                    />

                    {pickerTarget === 'config' && (
                      <div className="absolute z-[60] left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-80 animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                           <input 
                             autoFocus
                             value={pickerSearch}
                             onChange={e => setPickerSearch(e.target.value)}
                             placeholder="Search products..."
                             className="w-full bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none"
                           />
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                           {products.filter(p => p.name.toLowerCase().includes(pickerSearch.toLowerCase())).map(p => (
                             <button
                               key={p.id}
                               onClick={() => {
                                 setConfig({...config, side_promo_link: `/customer/products/${p.id}`})
                                 setPickerTarget(null)
                                 setPickerSearch("")
                               }}
                               className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all text-left group"
                             >
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0">
                                   {p.images?.[0] ? <img src={resolveImageUrl(p.images[0].url)} className="w-full h-full object-cover"/> : <FiPackage className="m-auto text-slate-300" size={16}/>}
                                </div>
                                <div className="min-w-0">
                                   <p className="text-[11px] font-black text-slate-700 dark:text-white truncate">{p.name}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: #{p.id}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 mt-4"
                  >
                    {savingConfig ? "Syncing..." : "Update Promotion"}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-box-bg dark:bg-box-dark-bg w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-box-border dark:border-box-dark-border relative">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/20 rounded-t-[2.5rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center shadow-lg border border-sky-100 dark:border-sky-900/30">
                  <FiImage size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{editingBanner ? 'Edit Banner' : 'New Banner Slide'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Configure visuals and text for the hero carousel</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-rose-500 transition-all">
                <FiX size={24}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Title</label>
                    <input 
                      type="text" 
                      value={formData.title_text}
                      onChange={e => setFormData({...formData, title_text: e.target.value})}
                      placeholder="e.g. SUMMER SALE"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subtext / Discount</label>
                    <input 
                      type="text" 
                      value={formData.subtitle_text}
                      onChange={e => setFormData({...formData, subtitle_text: e.target.value})}
                      placeholder="e.g. 50% OFF EVERYTHING"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slide Image</label>
                   <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
                      {formData.image_url ? (
                        <>
                          <img src={resolveImageUrl(formData.image_url)} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <label className="cursor-pointer p-4 rounded-2xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all">
                                <FiUploadCloud size={24}/>
                                <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                             </label>
                          </div>
                        </>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2 p-8 text-slate-300 hover:text-sky-500 transition-colors">
                           {isUploading ? <FiLoader className="animate-spin" size={32}/> : <FiUploadCloud size={32}/>}
                           <span className="text-[10px] font-black uppercase tracking-widest">{isUploading ? "Uploading..." : "Upload Slide Image"}</span>
                           <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*" />
                        </label>
                      )}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link URL (Routing)</label>
                    <button 
                      type="button"
                      onClick={() => setPickerTarget(pickerTarget === 'banner' ? null : 'banner')}
                      className="text-[9px] font-black text-sky-500 hover:text-sky-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      <FiPlusCircle size={12}/> {pickerTarget === 'banner' ? 'Close Picker' : 'Select Product'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.link_url}
                    onChange={e => setFormData({...formData, link_url: e.target.value})}
                    placeholder="e.g. /customer/products/5"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all shadow-inner"
                  />

                  {/* Product Picker Dropdown */}
                  {pickerTarget === 'banner' && (
                    <div className="absolute z-[110] left-0 right-0 top-full mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-96 animate-in fade-in slide-in-from-top-4 duration-300 ease-out origin-top transition-all">
                       <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                          <div className="relative">
                             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                             <input 
                               autoFocus
                               value={pickerSearch}
                               onChange={e => setPickerSearch(e.target.value)}
                               placeholder="Search products..."
                               className="w-full bg-white dark:bg-slate-900 pl-9 pr-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 focus:border-sky-500 outline-none"
                             />
                          </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                          {products.filter(p => p.name.toLowerCase().includes(pickerSearch.toLowerCase())).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, link_url: `/customer/products/${p.id}`})
                                setPickerTarget(null)
                                setPickerSearch("")
                              }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-all text-left group"
                            >
                               <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 overflow-hidden shrink-0 border border-black/5">
                                  {p.images?.[0] ? <img src={resolveImageUrl(p.images[0].url)} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><FiPackage size={20}/></div>}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-xs font-black text-slate-700 dark:text-white truncate group-hover:text-sky-600 transition-colors">{p.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: #{p.id} · ${Number(p.price).toFixed(2)}</p>
                               </div>
                            </button>
                          ))}
                          {products.filter(p => p.name.toLowerCase().includes(pickerSearch.toLowerCase())).length === 0 && (
                            <div className="py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No products found</div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Order</label>
                  <input 
                    type="number" 
                    value={formData.display_order}
                    onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-sky-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving || isUploading}
                  className="px-10 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
