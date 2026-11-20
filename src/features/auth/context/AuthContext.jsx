import React, { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "@shared/api/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function clearAuthStorage() {
  sessionStorage.removeItem("isAuthenticated");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("role");
  localStorage.removeItem("role");
}

export const AuthProvider = ({ children }) => {
  const storedAuth = sessionStorage.getItem("isAuthenticated");
  const storedUsername = sessionStorage.getItem("username");
  const storedRole = sessionStorage.getItem("role");

  const [isAuthenticated, setIsAuthenticated] = useState(storedAuth === "true");
  const [username, setUsername] = useState(storedUsername || "");
  const [role, setRole] = useState(storedRole || "");
  // New tabs share the auth cookie but not sessionStorage — wait for verify
  // before ProtectedRoute redirects to login (which was dropping ?tenant=).
  const [authReady, setAuthReady] = useState(false);

  const checkAuthentication = async () => {
    try {
      const data = await authApi.verify();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setUsername(data.username);
        setRole(data.role);
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("username", data.username || "");
        sessionStorage.setItem("role", data.role || "");
      } else {
        setIsAuthenticated(false);
        setUsername("");
        setRole("");
        clearAuthStorage();
      }
    } catch {
      setIsAuthenticated(false);
      setUsername("");
      setRole("");
      clearAuthStorage();
    } finally {
      setAuthReady(true);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const login = (data) => {
    setIsAuthenticated(data.authenticated);
    setUsername(data.username);
    setRole(data.role);
    setAuthReady(true);
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("username", data.username);
    sessionStorage.setItem("role", data.role);
    localStorage.removeItem("role");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setRole("");
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authReady,
        username,
        login,
        logout,
        role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
