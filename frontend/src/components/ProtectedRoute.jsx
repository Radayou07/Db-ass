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

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // If it's a customer, redirect to the customer portal if possible, else login
    if (user?.role === "customer") {
      const customerUrl = import.meta.env.VITE_CUSTOMER_URL
      if (customerUrl) {
        window.location.href = customerUrl
        return null
      }
    }
    // Role not authorized for this specific route
    return <Navigate to="/login" replace />
  }

  return children
}
