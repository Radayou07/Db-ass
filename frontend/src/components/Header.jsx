import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiSearch, FiPhoneCall, FiUser, FiHeart, FiShoppingCart, FiChevronDown, FiMenu, FiLogOut, FiSun, FiMoon } from 'react-icons/fi'

export default function Header({ isDark, setIsDark }) {
  const { user, logout, authFetch } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cartCount, setCartCount] = useState(0)
  
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await authFetch('/categories')
        if (res.ok) setCategories(await res.json())
      } catch (err) {}
    }
    fetchCategories()
  }, [authFetch])

  const fetchCartCount = async () => {
    try {
      const res = await authFetch('/cart')
      if (res.ok) {
        const data = await res.json()
        const count = data.reduce((sum, item) => sum + item.quantity, 0)
        setCartCount(count)
      }
    } catch (err) {}
  }

  useEffect(() => {
    if (user?.role === "customer") {
      fetchCartCount()
      window.addEventListener('cart_updated', fetchCartCount)
      return () => window.removeEventListener('cart_updated', fetchCartCount)
    }
  }, [user, authFetch])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/customer/products?q=${encodeURIComponent(searchQuery)}&cat=${encodeURIComponent(selectedCategory)}`)
  }

  return (
    <header className="flex flex-col w-full bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 transition-colors duration-300">
      
      {/* ─── TOP BAR ─── */}
      <div className="w-full bg-slate-900 dark:bg-black text-slate-300 dark:text-slate-400 py-1.5 px-6 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest hidden md:flex">
        <div className="flex-1 flex justify-center text-white">
          <p>Get Up to <span className="text-sky-400">40% OFF</span> New-Season Styles</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/customer/orders" className="hover:text-white transition-colors">Track Order</Link>
          <span className="hover:text-white transition-colors cursor-pointer">About</span>
          <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
          <span className="hover:text-white transition-colors cursor-pointer border-r border-slate-700 pr-4">Help & FAQs</span>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 text-white hover:text-sky-400 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <FiSun size={14} className="text-amber-400" /> : <FiMoon size={14} />}
            <span className="text-[9px]">{isDark ? 'LIGHT' : 'DARK'}</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN NAVBAR ─── */}
      <div className="w-full py-5 px-6 flex items-center justify-between gap-8 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/customer" className="shrink-0 flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/30">
            S
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Storefront</h1>
            <p className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em] leading-none mt-0.5">eCommerce</p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl hidden lg:block">
          <form onSubmit={handleSearch} className="flex items-center h-12 rounded-full border-2 border-sky-500 focus-within:ring-4 ring-sky-500/20 transition-all bg-white dark:bg-slate-950 overflow-hidden">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-full px-5 bg-transparent text-sm font-medium text-slate-800 dark:text-white outline-none placeholder:text-slate-400"
            />
            <div className="h-full flex items-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none appearance-none pr-6 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-14 h-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-600 transition-colors">
              <FiSearch size={20} />
            </button>
          </form>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden xl:flex items-center gap-3 mr-4">
            <FiPhoneCall size={28} className="text-slate-300" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Call Us Now</p>
              <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">+123 5678 890</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-700 dark:text-slate-200">
            <Link to="/customer/profile" className="flex flex-col items-center gap-1 hover:text-sky-500 transition-colors">
              <FiUser size={24} />
              <span className="text-[9px] font-bold uppercase tracking-widest hidden md:block">Account</span>
            </Link>
            <div className="flex flex-col items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer">
              <FiHeart size={24} />
              <span className="text-[9px] font-bold uppercase tracking-widest hidden md:block">Wishlist</span>
            </div>
            <Link to="/customer/cart" className="relative flex flex-col items-center gap-1 hover:text-sky-500 transition-colors cursor-pointer">
              <div className="relative">
                <FiShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px] font-black border-2 border-white dark:border-slate-900">{cartCount}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest hidden md:block">Cart</span>
            </Link>
            <button onClick={() => { logout(); navigate('/login'); }} className="flex flex-col items-center gap-1 hover:text-rose-500 transition-colors group">
              <FiLogOut size={24} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="text-[9px] font-bold uppercase tracking-widest hidden md:block">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECONDARY NAVBAR ─── */}
      <div className="w-full border-t border-black/5 dark:border-white/5 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-8">
          <Link to="/customer" className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${location.pathname === '/customer' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-sky-500'}`}>Home</Link>
          <Link to="/customer/products" className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${location.pathname === '/customer/products' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-sky-500'}`}>Products</Link>
          <Link to="/customer/orders" className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${location.pathname === '/customer/orders' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-sky-500'}`}>Orders</Link>
          
          <button className="ml-auto py-4 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 flex items-center gap-2">
            Outlet Sale!
          </button>
        </div>
      </div>
    </header>
  )
}
