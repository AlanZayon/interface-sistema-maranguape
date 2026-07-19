import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Restricts a route to the given roles. Non-matching users go to `fallback`.
 * @param {{ roles: string[], fallback?: string, children: React.ReactNode }} props
 */
export default function RequireRole({
  roles,
  fallback = "/estrutura",
  children,
}) {
  const { role } = useAuth();

  if (!roles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
