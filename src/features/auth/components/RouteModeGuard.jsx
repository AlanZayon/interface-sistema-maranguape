import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getHomePath } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";
import {
  clearTenantSession,
  platformConsoleUrl,
  withTenantQuery,
} from "@shared/lib/tenant";

/**
 * Master host (isPlatform): only /tenants* for superadmin.
 * Tenant host: block /tenants* (municipal app only).
 */
export default function RouteModeGuard({ children, mode }) {
  const { isAuthenticated, role } = useAuth();
  const { isPlatform, slug } = useTenant();
  const location = useLocation();
  const tenantHome = withTenantQuery(
    getHomePath({ isPlatform: false, role }),
    slug
  );

  if (!isAuthenticated) {
    return <Navigate to={withTenantQuery("/", slug)} replace />;
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
      clearTenantSession();
      return <Navigate to={platformConsoleUrl("/tenants")} replace />;
    }
    if (isTenantsPath) {
      return <Navigate to={tenantHome} replace />;
    }
    return children;
  }

  return children;
}
