// App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Container, Form } from 'react-bootstrap';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import MainScreen from './components/MainScreen';
import SetorScreen from './components/SetorScreen';
import FuncionariosScreen from './components/FuncionariosScreen';
import FilterOffcanvas from './components/FilterOffcanvas';
import Login from './components/LoginScreen'
import FunList from "./components/FuncionariosList"
import ProtectedRoute from './components/ProtectedRoutes';
import "./App.css"

const queryClient = new QueryClient();

function App() {
  const [showFilter, setShowFilter] = useState(false);
  const [showFuncionarios, setShowFuncionarios] = useState(false);
  const [setorPathId, setSetorPathId] = useState('');
  const location = useLocation();

  // Atualiza o estado do setorId sempre que a URL mudar
  useEffect(() => {
    const pathParts = location.pathname.split('/'); // Divide a URL em partes
    if (location.pathname === '/mainscreen') {
      setSetorPathId('mainscreen'); // Se for a página mainscreen, usa "mainscreen"
    } else {
      setSetorPathId(pathParts[pathParts.length - 1]); // Caso contrário, pega o último setorId da URL
    }
  }, [location.pathname]); // Executa sempre que a URL mudar

  const handleCloseFilter = () => setShowFilter(false);
  const handleShowFilter = () => setShowFilter(true);

  return (
    <QueryClientProvider client={queryClient}>
      <Container fluid>
        {/* Renderiza o Header se não estiver na rota de login */}
        {location.pathname !== '/' && <Header handleShowFilter={handleShowFilter} />}


        {/* Checkbox para Mostrar Funcionários */}
        {location.pathname !== '/' && (
          <div className='m-2 checkbox-container' style={{ top: 10, left: 10, zIndex: 1000 }}>
            <Form.Check
              type="checkbox"
              label="Mostrar todos os funcionários"
              checked={showFuncionarios}
              onChange={() => setShowFuncionarios(!showFuncionarios)}
            />
          </div>
        )}

        {/* Exibir Componente Funcionarios Condicionalmente */}
        {showFuncionarios ? (
          <FunList setorPathId={setorPathId} />
        ) : (
          <>
            {/* Conteúdo de Rota */}
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/mainscreen" element={
                <ProtectedRoute>
                  <MainScreen />
                </ProtectedRoute>
              } />
              <Route path="/setor/:setorId/*" element={
                <ProtectedRoute>
                  <SetorScreenWrapper />
                </ProtectedRoute>
              } />
            </Routes>
          </>
        )}
      </Container>
    </QueryClientProvider>
  );

  // Wrapper para passar uma chave única com base na rota
  function SetorScreenWrapper() {
    const { setorId } = useParams();
    return <SetorScreen key={setorId} />;
  }
}

export default App;
