import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

// Criação do contexto de autenticação
const AuthContext = createContext();

// Hook para usar o AuthContext
export const useAuth = () => useContext(AuthContext);

// Provedor de autenticação
export const AuthProvider = ({ children }) => {

    const [funcionariosPath, setFuncionariosPath] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);

    // Tentando obter o estado de autenticação do localStorage
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedUsername = sessionStorage.getItem('username');
    const storedRole = localStorage.getItem('role');


    const [isAuthenticated, setIsAuthenticated] = useState(storedAuth === 'true'); // Estado de autenticação
    const [username, setUsername] = useState(storedUsername || '');
    const [role, setRole] = useState(storedRole || '');


const addFuncionarios = (newData) => {
  setFuncionarios((prevUsers) => {
    if (!prevUsers || typeof prevUsers !== "object") return prevUsers;

    const prevUsersObject = { ...prevUsers };
    const updatedUsersArray = Array.isArray(newData) ? newData : [newData];

    updatedUsersArray.forEach((user) => {
      const coordenadoriaId = user.coordenadoria;
      if (!coordenadoriaId) return;

      // Remove o funcionário de outras coordenadorias, se existir
      for (const coordId in prevUsersObject) {
        prevUsersObject[coordId] = prevUsersObject[coordId].filter(u => u._id !== user._id);
      }

      // Agora adiciona ou atualiza o funcionário na coordenadoria correta
      if (!prevUsersObject[coordenadoriaId]) {
        prevUsersObject[coordenadoriaId] = [];
      }

      const index = prevUsersObject[coordenadoriaId].findIndex(u => u._id === user._id);

      if (index !== -1) {
        // Atualiza funcionário existente
        prevUsersObject[coordenadoriaId][index] = {
          ...prevUsersObject[coordenadoriaId][index],
          ...user,
        };
      } else {
        // Adiciona novo funcionário
        prevUsersObject[coordenadoriaId].push(user);
      }
    });

    return prevUsersObject;
  });
};
    
const addFuncionariosPath = (newData) => {
  setFuncionariosPath((prevUsers) => {
    if (!prevUsers || typeof prevUsers !== "object") return [];

    const prevUsersObject = {};
    for (const key in prevUsers) {
      prevUsersObject[key] = Array.isArray(prevUsers[key]) ? [...prevUsers[key]] : [];
    }

    const updatedUsers = Array.isArray(newData) ? newData : [newData];

    updatedUsers.forEach((user) => {
      const coordenadoriaId = user.coordenadoria;
      if (!coordenadoriaId) return;

      // Remove o usuário de qualquer coordenadoria em que ele já exista
      for (const coordId in prevUsersObject) {
        prevUsersObject[coordId] = prevUsersObject[coordId].filter(
          (u) => u._id !== user._id
        );
      }

      // Adiciona o usuário à coordenadoria correta
      if (!prevUsersObject[coordenadoriaId]) {
        prevUsersObject[coordenadoriaId] = [];
      }

      prevUsersObject[coordenadoriaId].push(user);
    });

    const allUsersArray = Object.values(prevUsersObject).flat();

    return allUsersArray;
  });
};


    



    // Função para verificar se o usuário está autenticado
    const checkAuthentication = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/usuarios/verify`, { withCredentials: true });
            if (response.data.authenticated) {
                setIsAuthenticated(true);
                setUsername(response.data.username);
                setRole(response.data.role)
            } else {
                setIsAuthenticated(false);
                setUsername('');
                setRole('');
            }
        } catch (error) {
            setIsAuthenticated(false);
            setUsername('');
            setRole('');
        }
    };

    useEffect(() => {
        // Ao carregar a página, verifica se o usuário está autenticado
        const storedAuth = sessionStorage.getItem('isAuthenticated');
        const storedUsername = sessionStorage.getItem('username');

        if (storedAuth === 'true') {
            setIsAuthenticated(true);
            setUsername(storedUsername || '');
            setRole(storedRole || '')
        }
        checkAuthentication();
    }, []);

    // Função para fazer login
    const login = (data) => {
        setIsAuthenticated(data.authenticated);
        setUsername(data.username);
        setRole(data.role)
        // Persistindo no localStorage
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);

    };

    // Função para fazer logout
    const logout = () => {
        setIsAuthenticated(false);
        setUsername('');
        setRole('')
        // Limpando o localStorage
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('username');
        localStorage.removeItem('role');
    };

    return (
        <AuthContext.Provider value={{
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
            addFuncionariosPath
        }}>
            {children}
        </AuthContext.Provider>
    );
};
