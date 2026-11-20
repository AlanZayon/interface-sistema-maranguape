import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth";
import { LoadingState } from "@shared/ui";

function buildLoginPath(location) {
  const params = new URLSearchParams();
  const current = new URLSearchParams(location.search || "");
  const tenant = current.get("tenant");
  if (tenant) params.set("tenant", tenant);

  const redirect = `${location.pathname || "/"}${location.search || ""}`;
  if (redirect && redirect !== "/" && redirect.startsWith("/") && !redirect.startsWith("//")) {
    params.set("redirect", redirect);
  }

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return <LoadingState label="Validando sessão..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={buildLoginPath(location)} replace />;
  }

  return children;
};

export default ProtectedRoute;
