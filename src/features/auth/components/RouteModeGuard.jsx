import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getHomePath } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";

/**
 * Master host (isPlatform): only /tenants* for superadmin.
 * Tenant host: block /tenants* (municipal app only).
 */
export default function RouteModeGuard({ children, mode }) {
  const { isAuthenticated, role } = useAuth();
  const { isPlatform } = useTenant();
  const location = useLocation();
  const tenantHome = getHomePath({ isPlatform: false, role });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isTenantsPath = location.pathname.startsWith("/tenants");

  if (mode === "platform") {
    if (!isPlatform) {
      return <Navigate to={tenantHome} replace />;
    }
    if (role !== "superadmin") {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  if (mode === "tenant") {
    if (isPlatform) {
      return <Navigate to="/tenants" replace />;
    }
    if (isTenantsPath) {
      return <Navigate to={tenantHome} replace />;
    }
    return children;
  }

  return children;
}
