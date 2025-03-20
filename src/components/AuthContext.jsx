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
    
            // Garantindo que newData seja um array
            const updatedUsersArray = Array.isArray(newData) ? newData : [newData];
    
            updatedUsersArray.forEach((user) => {
                const coordenadoriaId = user.coordenadoria;
    
                if (!coordenadoriaId) return; 
    
                if (!prevUsersObject[coordenadoriaId]) {
                    prevUsersObject[coordenadoriaId] = [];
                }
    
                const existingIndex = prevUsersObject[coordenadoriaId].findIndex(
                    (u) => u._id === user._id
                );
    
                if (existingIndex !== -1) {
                    prevUsersObject[coordenadoriaId][existingIndex] = {
                        ...prevUsersObject[coordenadoriaId][existingIndex],
                        ...user,
                    };
                } else {
                    prevUsersObject[coordenadoriaId].push(user);
                }
            });
    
            return prevUsersObject;
        });
    };
    
    
    
    const addFuncionariosPath = (newData) => {
        setFuncionariosPath((prevUsers) => {
    
            if (!prevUsers || typeof prevUsers !== "object") return prevUsers;
    
            const prevUsersArray = Array.isArray(prevUsers) ? prevUsers : Object.values(prevUsers);
    
            const updatedUsers = Array.isArray(newData) ? newData : [newData];
    
            const updatedList = prevUsersArray.map((user) => {
                const updatedUser = updatedUsers.find((u) => u._id === user._id);
                return updatedUser ? { ...user, ...updatedUser } : user;
            });
    
            const newUsers = updatedUsers.filter((u) => !prevUsersArray.some((user) => user._id === u._id));
    
            return [...updatedList, ...newUsers];
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
