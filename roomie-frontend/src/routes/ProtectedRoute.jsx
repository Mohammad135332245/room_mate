import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingBlock } from '../components/ui/Feedback'
import { useAuth } from '../context/AuthContext'

/**
 * Gate for authenticated routes. Pass `role` to restrict a branch to
 * students or landlords.
 */
export default function ProtectedRoute({ role }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingBlock label="Checking your session…" />

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/** Keeps signed-in users away from the login/register pages. */
export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingBlock label="Checking your session…" />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
