// App.js
import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Container, Form  } from 'react-bootstrap';
import Header from './components/Header';
import MainScreen from './components/MainScreen';
import SecretariasScreen from './components/SecretariasScreen';
import FuncionariosScreen from './components/FuncionariosScreen';
import FilterOffcanvas from './components/FilterOffcanvas';
import Login from './components/LoginScreen'
import FunList from "./components/FuncionariosList"
import "./App.css"

function App() {
  const [showFilter, setShowFilter] = useState(false);
  const [showFuncionarios, setShowFuncionarios] = useState(false);
  const location = useLocation();

  const handleCloseFilter = () => setShowFilter(false);
  const handleShowFilter = () => setShowFilter(true);

  return (
    <Container fluid>
      {/* Renderiza o Header se não estiver na rota de login */}
      {location.pathname !== '/' && <Header handleShowFilter={handleShowFilter} />}


     {/* Checkbox para Mostrar Funcionários */}
     {location.pathname !== '/' && (
        <div className='m-2 checkbox-container' style={{  top: 10, left: 10, zIndex: 1000 }}>
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
        <FunList secretaria="all" expandedGroups={{ all: true }} sector="all" />
      ) : (
        <>
          {/* Conteúdo de Rota */}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/mainscreen" element={<MainScreen />} />
            <Route path="/secretarias" element={<SecretariasScreen />} />
            <Route path="/secretarias/:secretaria" element={<FuncionariosScreen />} />
          </Routes>

          {/* Filtro Offcanvas */}
          <FilterOffcanvas showFilter={showFilter} handleCloseFilter={handleCloseFilter} />
        </>
      )}
    </Container>
  );
}

export default App;
