import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * PublicRoute — redirects authenticated users to /dashboard.
 * Renders child routes via <Outlet /> for unauthenticated visitors.
 */
const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;
