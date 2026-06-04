import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom' 
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header  from './components/Header'

// Public pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Protected pages
import Home      from './pages/Home'
import Products  from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Orders    from './pages/Orders'
import Profile   from './pages/Profile'
import Cart      from './pages/Cart'

// ── Layout wrapper ───────────────────────────────────────────────────
function AppLayout({ isDark, setIsDark }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Header isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full h-full">
          <Outlet /> 
        </div>
      </main>
    </div>
  )
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <div className={isDark ? 'dark' : ''}>
      <AuthProvider>
        <Router>
          <Routes>

            {/* ── Public routes ── */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ── Protected Layout Route Tree ── */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AppLayout isDark={isDark} setIsDark={setIsDark} />
                </ProtectedRoute>
              }
            >
              <Route index             element={<Home />} />
              <Route path="products"   element={<Products />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="cart"       element={<Cart />} />
              <Route path="orders"     element={<Orders />} />
              <Route path="profile"    element={<Profile />} />
              
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
