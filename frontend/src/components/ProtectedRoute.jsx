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
    // Role not authorized for this specific route
    return <Navigate to="/" replace />
  }

  return children
}
