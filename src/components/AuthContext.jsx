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
            if (Array.isArray(newData)) {
                const updatedUsers = [...prevUsers];
    
                newData.forEach((newUser) => {
                    const existingUserIndex = updatedUsers.findIndex(
                        (user) => user._id === newUser._id
                    );
    
                    if (existingUserIndex !== -1) {
                        // Usuário com o mesmo ID já existe
                        const existingUser = updatedUsers[existingUserIndex];
                        if (existingUser.coordenadoria !== newUser.coordenadoria) {
                            // Atualizar se a coordenadoria for diferente
                            updatedUsers[existingUserIndex] = { ...existingUser, ...newUser };
                        }
                    } else {
                        // Adicionar novo usuário
                        updatedUsers.push(newUser);
                    }
                });
    
                return updatedUsers;
            } else {
                // Lógica para adicionar um único usuário
                const existingUserIndex = prevUsers.findIndex(
                    (user) => user._id === newData._id
                );
    
                if (existingUserIndex !== -1) {
                    const existingUser = prevUsers[existingUserIndex];
                    if (existingUser.coordenadoria !== newData.coordenadoria) {
                        // Atualizar se a coordenadoria for diferente
                        return [
                            ...prevUsers.slice(0, existingUserIndex),
                            { ...existingUser, ...newData },
                            ...prevUsers.slice(existingUserIndex + 1),
                        ];
                    }
                    return prevUsers; // Não faz nada se a coordenadoria for igual
                } else {
                    return [...prevUsers, newData]; // Adicionar novo usuário
                }
            }
        });
    };
    
    
    const addFuncionariosPath = (newData) => {
        setFuncionariosPath((prevUsers) => {
            if (Array.isArray(newData)) {
                const updatedUsers = [...prevUsers];
    
                newData.forEach((newUser) => {
                    const existingUserIndex = updatedUsers.findIndex(
                        (user) => user._id === newUser._id
                    );
    
                    if (existingUserIndex !== -1) {
                        // Usuário com o mesmo ID já existe
                        const existingUser = updatedUsers[existingUserIndex];
                        if (existingUser.coordenadoria !== newUser.coordenadoria) {
                            // Atualizar se a coordenadoria for diferente
                            updatedUsers[existingUserIndex] = { ...existingUser, ...newUser };
                        }
                    } else {
                        // Adicionar novo usuário
                        updatedUsers.push(newUser);
                    }
                });
    
                return updatedUsers;
            } else {
                // Lógica para adicionar um único usuário
                const existingUserIndex = prevUsers.findIndex(
                    (user) => user._id === newData._id
                );
    
                if (existingUserIndex !== -1) {
                    const existingUser = prevUsers[existingUserIndex];
                    if (existingUser.coordenadoria !== newData.coordenadoria) {
                        // Atualizar se a coordenadoria for diferente
                        return [
                            ...prevUsers.slice(0, existingUserIndex),
                            { ...existingUser, ...newData },
                            ...prevUsers.slice(existingUserIndex + 1),
                        ];
                    }
                    return prevUsers; // Não faz nada se a coordenadoria for igual
                } else {
                    return [...prevUsers, newData]; // Adicionar novo usuário
                }
            }
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
