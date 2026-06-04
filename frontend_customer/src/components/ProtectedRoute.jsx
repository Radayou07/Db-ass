import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

/**
 * Wrap any route that requires login.
 * Pass allowedRoles=['admin', 'staff'] for restricted routes.
 *
 * Usage:
 *   <ProtectedRoute>                           — requires login
 *   <ProtectedRoute allowedRoles={['admin']}>  — requires admin
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If a staff or admin user accesses the customer portal, redirect them to the admin portal
  if (user?.role === "admin" || user?.role === "staff") {
    const adminUrl = import.meta.env.VITE_ADMIN_URL
    if (adminUrl) {
      window.location.href = adminUrl
      return null
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Role not authorized for this specific route
    return <Navigate to="/" replace />
  }

  return children
}
