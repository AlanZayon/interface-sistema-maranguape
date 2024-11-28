import { Navigate } from "react-router-dom";
import { useAuth } from './AuthContext'; // Importa o contexto de autenticação

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Pega o estado de autenticação


  if (!isAuthenticated) {
    return <Navigate to="/" />; // Redireciona para o login se não autenticado
  }

  return children; // Se estiver autenticado, renderiza o conteúdo da rota protegida
};

export default ProtectedRoute;
