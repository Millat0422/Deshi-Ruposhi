import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../common/Spinner';

// Only logged-in users. Guests are sent to /login and come back afterwards.
export function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing, loggedOut } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;
  if (!isAuthenticated && loggedOut) return <Navigate to="/" replace />;
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children || <Outlet />;
}

// Only admins. Everyone else is redirected (the API also enforces this).
export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, initializing, loggedOut } = useAuth();
  const location = useLocation();

  if (initializing) return <PageLoader />;
  if (!isAuthenticated && loggedOut) return <Navigate to="/" replace />;
  if (!isAuthenticated) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) return <Navigate to="/" replace state={{ forbidden: true }} />;
  return children || <Outlet />;
}

// Login/register pages: already logged-in users are sent away.
// After logging in, users go back to ?redirect=... (admins default to the dashboard).
export function GuestRoute({ children }) {
  const { isAuthenticated, isAdmin, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return <PageLoader />;
  if (isAuthenticated) {
    const target = safeRedirect(new URLSearchParams(location.search).get('redirect'), isAdmin ? '/admin' : '/');
    return <Navigate to={target} replace />;
  }
  return children;
}

// Only allow internal redirects like "/checkout" (never "//evil.com").
export const safeRedirect = (value, fallback = '/') =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
