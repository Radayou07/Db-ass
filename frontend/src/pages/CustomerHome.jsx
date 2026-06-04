import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FiChevronRight, FiTruck, FiShield, FiClock, FiCreditCard, FiActivity, FiBox, FiUser } from "react-icons/fi"

export default function CustomerHome() {
  const { authFetch } = useAuth()
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    setLoading(true)
    try {
      const [catsRes, prodsRes] = await Promise.all([
        authFetch("/categories"),
        authFetch("/products")
      ])
      
      if (catsRes.ok) setCategories(await res.json ? await catsRes.json() : [])
      if (prodsRes.ok) {
        const prods = await prodsRes.json()
        setFeaturedProducts(prods.slice(-4).reverse()) // New Arrivals
      }
    } catch (err) {
      console.error("Fetch data failed", err)
    } finally {
      setLoading(false)
    }
  }

  // Fixed a small bug in the data fetching logic above (catsRes.json was called wrong)
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const catsRes = await authFetch("/categories")
        if (catsRes.ok) setCategories(await catsRes.json())
        
        const prodsRes = await authFetch("/products")
        if (prodsRes.ok) {
          const prods = await prodsRes.json()
          setFeaturedProducts(prods.slice(-4).reverse())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [authFetch])


  if (loading) return (
    <div className="h-screen flex items-center justify-center text-sky-500 animate-pulse">
      <FiActivity size={40} />
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-8 pb-20">
      
      {/* ─── TOP SECTION: CATEGORIES & HERO ─── */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar: Shop By Category */}
        <div className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-900 dark:bg-black text-white px-5 py-4 font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="text-xl leading-none -mt-1">≡</span> Shop By Category
            </div>
            <div className="flex flex-col py-2">
              {categories.slice(0, 8).map((cat) => (
                <Link 
                  to={`/customer/products?cat=${cat.id}`} 
                  key={cat.id}
                  className="px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-slate-300"><FiChevronRight size={14}/></span>
                    {cat.name}
                  </span>
                </Link>
              ))}
              {categories.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-slate-400 font-medium">No categories found.</div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 text-center border border-black/5 dark:border-white/5 border-dashed">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 mb-2">Huge Sale</p>
            <p className="text-2xl font-black text-rose-500 mb-4 tracking-tighter">70% OFF</p>
            <Link to="/customer/products" className="inline-block px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">
              Shop Now
            </Link>
          </div>
        </div>

        {/* Right Area: Hero Banner */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="relative w-full h-[400px] lg:h-[480px] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm flex items-center">
            {/* Background image mockup */}
            <div className="absolute inset-0 opacity-20 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800"></div>
            
            {/* Content */}
            <div className="relative z-10 px-10 md:px-16 flex flex-col items-start gap-4">
               <h3 className="text-slate-400 dark:text-slate-500 font-black text-5xl md:text-7xl uppercase tracking-tighter opacity-30 absolute top-4 left-10 pointer-events-none select-none">BIG SALE</h3>
               <h3 className="text-slate-400 dark:text-slate-500 font-black text-5xl md:text-7xl uppercase tracking-tighter opacity-30 absolute top-20 left-10 pointer-events-none select-none">BIG SALE</h3>
               
               <div className="mt-20 z-20">
                 <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-4">
                   BIG SALE
                 </h2>
                 <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 inline-block px-4 py-1.5 font-black uppercase tracking-widest text-xs mb-8 rotate-[-2deg] shadow-lg">
                   Up to 70% Off All Items
                 </div>
               </div>

               <div className="flex items-center gap-6 mt-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Save up to</p>
                   <p className="text-4xl font-black text-rose-500 bg-rose-100 dark:bg-rose-950/50 px-4 py-1 rounded-xl tracking-tighter inline-block">$199<span className="text-xl align-top">99</span></p>
                 </div>
                 <Link to="/customer/products" className="ml-4 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest hover:-translate-y-1 transition-transform shadow-lg rounded-xl">
                   Shop Now!
                 </Link>
               </div>
            </div>
            
            <div className="absolute right-0 bottom-0 h-[90%] w-1/2 hidden md:block">
              <div className="w-full h-full bg-slate-300 dark:bg-slate-700 rounded-tl-[100px] flex items-center justify-center opacity-50">
                 <FiUser className="w-32 h-32 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRUST BADGES ROW ─── */}
      <div className="w-full bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-3xl shadow-sm p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          <div className="flex items-center gap-4 lg:justify-center pt-4 md:pt-0 pl-0 lg:pl-4 first:pt-0 first:pl-0">
            <FiTruck size={36} className="text-sky-500 shrink-0" strokeWidth={1.5} />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">Free Shipping & Returns</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Free shipping on all orders over $99.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:justify-center pt-4 md:pt-0 pl-0 md:pl-8 lg:pl-4">
            <FiShield size={36} className="text-sky-500 shrink-0" strokeWidth={1.5} />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">Money Back Guarantee</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">100% money back guarantee.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:justify-center pt-4 md:pt-0 pl-0 lg:pl-4">
            <FiClock size={36} className="text-sky-500 shrink-0" strokeWidth={1.5} />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">Online Support 24/7</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Lorem ipsum dolor sit amet.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:justify-center pt-4 md:pt-0 pl-0 md:pl-8 lg:pl-4">
            <FiCreditCard size={36} className="text-sky-500 shrink-0" strokeWidth={1.5} />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">Secure Payment</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Lorem ipsum dolor sit amet.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ─── NEW ARRIVALS PREVIEW ─── */}
      {featuredProducts.length > 0 && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">New Arrivals</h3>
            <Link to="/customer/products" className="text-xs font-bold text-slate-400 hover:text-sky-500 uppercase tracking-widest transition-colors">View All &rarr;</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <Link to={`/customer/products/${product.id}`} key={product.id} className="group flex flex-col gap-3">
                <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative">
                  {product.images?.length > 0 ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBox className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                     <button className="w-full py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-white transition-colors">Quick View</button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{product.category_name || "Misc"}</p>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1 group-hover:text-sky-500 transition-colors">{product.name}</h4>
                  <p className="font-black text-slate-900 dark:text-white mt-1">${Number(product.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
