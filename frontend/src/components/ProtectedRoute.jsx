import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

/**
 * Wrap any route that requires login.
 * Pass allowedRoles=['admin', 'staff'] for restricted routes.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Role not authorized for this specific branch
    // Redirect back to root where RootRedirect will send them to their proper branch
    return <Navigate to="/" replace />
  }

  return children
}
