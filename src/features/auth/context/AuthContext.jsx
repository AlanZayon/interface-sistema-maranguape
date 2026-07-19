import React, { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "@shared/api/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const storedAuth = sessionStorage.getItem("isAuthenticated");
  const storedUsername = sessionStorage.getItem("username");
  const storedRole = sessionStorage.getItem("role");

  const [isAuthenticated, setIsAuthenticated] = useState(storedAuth === "true");
  const [username, setUsername] = useState(storedUsername || "");
  const [role, setRole] = useState(storedRole || "");

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
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("role");
      }
    } catch {
      setIsAuthenticated(false);
      setUsername("");
      setRole("");
      sessionStorage.removeItem("isAuthenticated");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("role");
    }
  };

  useEffect(() => {
    const auth = sessionStorage.getItem("isAuthenticated");
    const user = sessionStorage.getItem("username");
    const userRole = sessionStorage.getItem("role");

    if (auth === "true") {
      setIsAuthenticated(true);
      setUsername(user || "");
      setRole(userRole || "");
    }
    checkAuthentication();
  }, []);

  const login = (data) => {
    setIsAuthenticated(data.authenticated);
    setUsername(data.username);
    setRole(data.role);
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("username", data.username);
    sessionStorage.setItem("role", data.role);
    localStorage.removeItem("role");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setRole("");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
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
