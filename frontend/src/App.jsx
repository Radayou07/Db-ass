import { useState, useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom' 
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SideBar  from './components/SideBar'
import Header   from './components/Header'

// Public pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Admin/Staff pages
import Home      from './pages/Home'
import Products  from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Inventories from "./pages/Inventories"
import Orders    from './pages/Orders'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import Brands    from './pages/Brands'
import Staff     from './pages/Staff'
import Analysis  from './pages/Analysis'
import Discounts from './pages/Discounts'
import Profile   from './pages/Profile'
import Approvals from './pages/Approvals'
import ManageStore from './pages/ManageStore'

// Customer pages
import CustomerHome from './pages/CustomerHome'
import CustomerProducts from './pages/CustomerProducts'
import Cart from './pages/Cart'

// ── Layout wrappers ───────────────────────────────────────────────────

function StaffLayout({ isDark, setIsDark }) {
  return (
    <div className="flex flex-row h-screen bg-main-bg dark:bg-main-dark-bg overflow-hidden">
      <SideBar isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  )
}

function CustomerLayout({ isDark, setIsDark }) {
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

// ── Root Redirect Logic ──────────────────────────────────────────────

function RootRedirect() {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  if (user?.role === 'admin' || user?.role === 'staff') {
    return <Navigate to="/staff" replace />
  }
  return <Navigate to="/customer" replace />
}

function AppContent() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <div className={isDark ? 'dark' : ''}>
      <Router>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/"         element={<RootRedirect />} />

          {/* ── Staff Routes ── */}
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <StaffLayout isDark={isDark} setIsDark={setIsDark} />
              </ProtectedRoute>
            }
          >
            <Route index             element={<Home />} />
            <Route path="products"   element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="inventories" element={<Inventories />} />
            <Route path="orders"     element={<Orders />} />
            <Route path="customers"  element={<Customers />} />
            <Route path="suppliers"  element={<Suppliers />} />
            <Route path="approvals"  element={<Approvals />} />
            <Route path="brands"     element={<Brands />} />
            <Route path="staff"      element={<ProtectedRoute allowedRoles={['admin']}><Staff /></ProtectedRoute>} />
            <Route path="analysis"   element={<Analysis />} />
            <Route path="discounts"  element={<Discounts />} />
            <Route path="storefront" element={<ManageStore />} />
            <Route path="profile"    element={<Profile />} />
          </Route>

          {/* ── Customer Routes ── */}
          <Route 
            path="/customer" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerLayout isDark={isDark} setIsDark={setIsDark} />
              </ProtectedRoute>
            }
          >
            <Route index             element={<CustomerHome />} />
            <Route path="products"   element={<CustomerProducts />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="cart"       element={<Cart />} />
            <Route path="orders"     element={<Orders />} />
            <Route path="profile"    element={<Profile />} />
          </Route>

          {/* ── Catch all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
