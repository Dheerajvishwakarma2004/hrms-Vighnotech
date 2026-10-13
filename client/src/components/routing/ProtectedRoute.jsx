import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { ROUTES } from '@/lib/constants';

/**
 * Guards private routes. Unauthenticated users (including after auto-logout) are sent to /login
 * with the requested location in `state.from` so they return to it after signing in.
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }
  return children ?? <Outlet />;
}
