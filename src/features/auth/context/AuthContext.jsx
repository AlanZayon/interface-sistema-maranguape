import React, { createContext, useContext, useState, useEffect } from "react";
import * as authApi from '@shared/api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [funcionariosPath, setFuncionariosPath] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [activateModified, setActivateModified] = useState(false);

  const storedAuth = sessionStorage.getItem("isAuthenticated");
  const storedUsername = sessionStorage.getItem("username");
  const storedRole = sessionStorage.getItem("role");

  const [isAuthenticated, setIsAuthenticated] = useState(storedAuth === "true");
  const [username, setUsername] = useState(storedUsername || "");
  const [role, setRole] = useState(storedRole || "");

  const addFuncionarios = (newData) => {
    setFuncionarios((prevUsers) => {
      if (!prevUsers || typeof prevUsers !== "object") return prevUsers;

      const prevUsersObject = { ...prevUsers };
      const updatedUsersArray = Array.isArray(newData) ? newData : [newData];

      updatedUsersArray.forEach((user) => {
        const lotacaoId = user.setorId || user.coordenadoria
          ? String(user.setorId || user.coordenadoria)
          : null;
        if (!lotacaoId) return;
        const userId = String(user._id);

        for (const coordId in prevUsersObject) {
          if (!Array.isArray(prevUsersObject[coordId])) continue;
          prevUsersObject[coordId] = prevUsersObject[coordId].filter(
            (u) => String(u._id) !== userId
          );
        }

        if (!prevUsersObject[lotacaoId]) {
          prevUsersObject[lotacaoId] = [];
        }

        const index = prevUsersObject[lotacaoId].findIndex(
          (u) => String(u._id) === userId
        );

        if (index !== -1) {
          prevUsersObject[lotacaoId][index] = {
            ...prevUsersObject[lotacaoId][index],
            ...user,
            setorId: lotacaoId,
            coordenadoria: lotacaoId,
          };
        } else {
          prevUsersObject[lotacaoId].push({
            ...user,
            setorId: lotacaoId,
            coordenadoria: lotacaoId,
          });
        }
      });

      return prevUsersObject;
    });
  };

  const addFuncionariosPath = (newData) => {
    setFuncionariosPath((prevUsers) => {
      if (!Array.isArray(prevUsers)) return [];

      const updatedUsers = Array.isArray(newData) ? newData : [newData];
      const updatedIds = new Set(
        updatedUsers.map((u) => String(u._id)).filter(Boolean)
      );

      // Sempre remove da lista atual quem foi transferido/atualizado
      let next = prevUsers.filter((u) => !updatedIds.has(String(u._id)));

      const lotacoesNaLista = new Set(
        next
          .map((u) => String(u.setorId || u.coordenadoria || ""))
          .filter(Boolean)
      );

      let needsRefetch = false;
      updatedUsers.forEach((user) => {
        const lotacaoId = user.setorId || user.coordenadoria;
        if (!lotacaoId) {
          needsRefetch = true;
          return;
        }

        const lotacaoKey = String(lotacaoId);
        if (lotacoesNaLista.has(lotacaoKey)) {
          next = [
            ...next,
            { ...user, setorId: lotacaoKey, coordenadoria: lotacaoKey },
          ];
        } else {
          needsRefetch = true;
        }
      });

      if (needsRefetch) setActivateModified(true);
      return next;
    });
  };

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
        funcionarios,
        funcionariosPath,
        setFuncionarios,
        setFuncionariosPath,
        addFuncionarios,
        addFuncionariosPath,
        activateModified,
        setActivateModified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
