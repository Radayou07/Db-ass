import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom' 
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SideBar  from './components/SideBar'

// Public pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Protected pages
import Home      from './pages/Home'
import Products  from './pages/Products'
import Inventories from "./pages/Inventories"
import Orders    from './pages/Orders'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import Staff     from './pages/Staff'
import Analysis  from './pages/Analysis'
import About     from './pages/About'

// ── Layout wrapper ───────────────────────────────────────────────────
function AppLayout({ isDark, setIsDark }) {
  return (
    <div className="flex flex-row h-screen bg-main-bg dark:bg-main-dark-bg overflow-hidden">
      <SideBar isDark={isDark} setIsDark={setIsDark} />
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  )
}

function App() {
  const [isDark, setIsDark] = useState(false)

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
              
              <Route 
                path="inventories" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <Inventories />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="orders"     element={<Orders />} />
              
              <Route 
                path="customers" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <Customers />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="suppliers" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <Suppliers />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="staff" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Staff />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="analysis" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <Analysis />
                  </ProtectedRoute>
                } 
              />

              <Route path="about"      element={<About />} />
              
              <Route path="*"          element={<Navigate to="/" replace />} />
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </div>
  )
}

export default App
