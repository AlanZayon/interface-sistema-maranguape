import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from './AuthContext';
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";
import { useState } from "react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const logoutUser = async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/usuarios/logout`,
          {},
          { withCredentials: true }
        );
        logout();
        setShouldRedirect(true);
      } catch (error) {
        console.error("Erro ao tentar fazer logout:", error);
        setShouldRedirect(true); 
      }
    };

    if (!isAuthenticated) {
      logoutUser();
    }
  }, [isAuthenticated, logout]);

  if (!isAuthenticated || shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
