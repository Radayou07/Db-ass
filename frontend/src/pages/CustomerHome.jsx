import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FiChevronRight, FiTruck, FiShield, FiClock, FiCreditCard, FiActivity, FiBox, FiUser, FiLayout } from "react-icons/fi"
import { ProductSkeleton } from "../components/Skeleton"

export default function CustomerHome() {
  const { authFetch, resolveImageUrl } = useAuth()
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [config, setConfig] = useState({
    side_promo_title: 'Huge Sale',
    side_promo_subtitle: '70% OFF',
    side_promo_link: '/customer/products'
  })
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [loading, setLoading] = useState(true)

  // Duplicate first banner at end for seamless loop
  const extendedBanners = banners.length > 1 ? [...banners, banners[0]] : banners

  // Combined fetch data logic
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [catsRes, prodsRes, bannersRes, configRes] = await Promise.all([
          authFetch("/categories"),
          authFetch("/products"),
          authFetch("/storefront/banners"),
          authFetch("/storefront/config")
        ])
        
        if (catsRes.ok) setCategories(await catsRes.json())
        if (prodsRes.ok) {
          const prods = await prodsRes.json()
          setFeaturedProducts(prods.slice(-6).reverse()) // New Arrivals (6 items)
        }
        if (bannersRes.ok) {
          const bannerData = await bannersRes.json()
          setBanners(bannerData)
        }
        if (configRes.ok) {
          setConfig(await configRes.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [authFetch])

  // Auto-slide logic (3 seconds)
  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentSlide(prev => prev + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [banners.length])

  // Seamless loop reset
  useEffect(() => {
    if (currentSlide === extendedBanners.length - 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        setCurrentSlide(0)
      }, 800) // Duration of 800ms transition
      return () => clearTimeout(timer)
    }
  }, [currentSlide, extendedBanners.length])


  const totalPendingValue = featuredProducts.length === 0 && loading

  return (
    <div className="p-6 flex flex-col gap-8 pb-20">
      
      {/* ─── TOP SECTION: CATEGORIES & HERO ─── */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar: Shop By Category */}
        <div className="w-full lg:w-[220px] shrink-0 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-900 dark:bg-black text-white px-5 py-4 font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="text-xl leading-none -mt-1">≡</span> Shop By Category
            </div>
            <div className="flex flex-col py-2">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="px-5 py-3"><div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></div>
                ))
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
          
          <div className="relative bg-slate-100 dark:bg-slate-800/50 rounded-3xl overflow-hidden text-center border border-black/5 dark:border-white/5 shadow-sm group">
            {loading ? (
               <div className="p-8 h-[220px] bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                {config.side_promo_image_url && (
                  <>
                    <img 
                      src={resolveImageUrl(config.side_promo_image_url)} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                  </>
                )}
                
                <div className={`relative z-10 p-8 flex flex-col items-center ${config.side_promo_image_url ? 'min-h-[220px] justify-end' : ''}`}>
                   <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${config.side_promo_image_url ? 'text-slate-300' : 'text-slate-800 dark:text-slate-200'}`}>
                     {config.side_promo_title}
                   </p>
                   <p className={`text-3xl font-black mb-6 tracking-tighter ${config.side_promo_image_url ? 'text-white' : 'text-rose-500'}`}>
                     {config.side_promo_subtitle}
                   </p>
                   <Link 
                     to={config.side_promo_link} 
                     className={`inline-block px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                       config.side_promo_image_url 
                        ? 'bg-white text-slate-900 hover:bg-sky-500 hover:text-white' 
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-sky-500 dark:hover:bg-sky-500'
                     }`}
                   >
                     Shop Now
                   </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Area: Hero Banner Carousel */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <div className="relative w-full h-[400px] lg:h-[480px] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm flex items-center">
            
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                <FiActivity size={40} className="text-slate-300 animate-spin" />
              </div>
            ) : banners.length > 0 ? (
              <div className="w-full h-full relative">
                {/* Film Strip Wrapper with Explicit Transition */}
                <div 
                  className="flex h-full"
                  style={{ 
                    transform: `translateX(-${currentSlide * 100}%)`,
                    transition: isTransitioning ? 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    willChange: 'transform'
                  }}
                >
                  {extendedBanners.map((banner, idx) => (
                    <div 
                      key={`${banner.id}-${idx}`}
                      className="w-full h-full shrink-0 relative"
                    >
                      {/* Background image */}
                      <img 
                        src={resolveImageUrl(banner.image_url)} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-transparent dark:from-slate-900/90 dark:via-slate-900/40 dark:to-transparent"></div>
                      
                      {/* Content */}
                      <div className="relative h-full z-10 px-10 md:px-16 flex flex-col items-start justify-center gap-4">
                         <h3 className="text-slate-400 dark:text-slate-500 font-black text-5xl md:text-7xl uppercase tracking-tighter opacity-10 absolute top-4 left-10 pointer-events-none select-none">{banner.title_text}</h3>
                         
                         <div className="z-20">
                           <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-4 max-w-lg">
                             {banner.title_text}
                           </h2>
                           {banner.subtitle_text && (
                             <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 inline-block px-4 py-1.5 font-black uppercase tracking-widest text-xs mb-8 rotate-[-2deg] shadow-lg">
                               {banner.subtitle_text}
                             </div>
                           )}
                         </div>

                         <div className="flex items-center gap-6 mt-4">
                           <Link 
                             to={banner.link_url || "/customer/products"} 
                             className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm uppercase tracking-widest hover:-translate-y-1 transition-transform shadow-xl shadow-sky-200 dark:shadow-none rounded-xl"
                           >
                             Discover More
                           </Link>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Indicators */}
                {banners.length > 1 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3 bg-black/10 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    {banners.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setIsTransitioning(true)
                          setCurrentSlide(idx)
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentSlide || (currentSlide === banners.length && idx === 0) ? 'w-8 bg-sky-500' : 'w-2 bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Fallback if no banners */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900">
                <FiLayout className="w-16 h-16 text-slate-200 mb-4" />
                <h2 className="text-3xl font-black text-slate-400 uppercase tracking-tighter">Welcome to our Store</h2>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-2">Staff can add promotional banners in the Storefront menu</p>
              </div>
            )}

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
      <div className="mt-4 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-widest uppercase">New Arrivals</h3>
          <Link to="/customer/products" className="text-[10px] font-black text-slate-400 hover:text-sky-500 uppercase tracking-widest transition-colors">View All &rarr;</Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => <ProductSkeleton key={i} isInternal={false} />)
          ) : (
            featuredProducts.map(product => (
              <Link to={`/customer/products/${product.id}`} key={product.id} className="group flex flex-col gap-2">
                <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-black/5 dark:border-white/5">
                  {product.images?.length > 0 ? (
                    <img src={resolveImageUrl(product.images[0].url)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBox className="w-8 h-8 text-slate-200" />
                    </div>
                  )}
                  <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                     <button className="w-full py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">Quick View</button>
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{product.category_name || "Misc"}</p>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs line-clamp-1 group-hover:text-sky-500 transition-colors">{product.name}</h4>
                  <p className="font-black text-slate-900 dark:text-white mt-0.5 text-sm">${Number(product.price).toFixed(2)}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
