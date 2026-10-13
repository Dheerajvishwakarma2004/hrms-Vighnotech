import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { ROUTES } from '@/lib/constants';

const PUBLIC_PATHS = [ROUTES.login, ROUTES.register];

/** Where to go after authenticating: the originally requested page (path + filters), else the dashboard. */
function getRedirectTarget(location) {
  const from = location.state?.from;
  if (!from?.pathname || PUBLIC_PATHS.includes(from.pathname)) return ROUTES.dashboard;
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

/**
 * Wraps /login and /register. Once the user is authenticated (login/register success,
 * or another tab logs in) it redirects to `location.state.from`.
 */
export default function PublicOnlyRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={getRedirectTarget(location)} replace />;
  }
  return children ?? <Outlet />;
}
