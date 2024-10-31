// App.js
import React, { useState } from 'react';
import { Routes, Route, useLocation  } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import MainScreen from './components/MainScreen';
import SecretariasScreen from './components/SecretariasScreen';
import FuncionariosScreen from './components/FuncionariosScreen';
import FilterOffcanvas from './components/FilterOffcanvas';
import Login from './components/LoginScreen'
import "./App.css"

function App() {
  const [showFilter, setShowFilter] = useState(false);
  const location = useLocation();

  const handleCloseFilter = () => setShowFilter(false);
  const handleShowFilter = () => setShowFilter(true);

  return (
      <Container fluid>
      {/* Renderiza o Header se não estiver na rota de login */}
      {location.pathname !== '/' && <Header handleShowFilter={handleShowFilter} />}
        
        {/* Conteúdo de Rota */}
        <Routes>
          <Route path='/' element={<Login />} />
          <Route path="/mainscreen" element={<MainScreen />} />
          <Route path="/secretarias" element={<SecretariasScreen />} />
          <Route path="/secretarias/:secretaria" element={<FuncionariosScreen />} />
        </Routes>

        {/* Filtro Offcanvas */}
        <FilterOffcanvas showFilter={showFilter} handleCloseFilter={handleCloseFilter} />
      </Container>
  );
}

export default App;
