// App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Container, Form } from "react-bootstrap";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "./components/Header";
import MainScreen from "./components/MainScreen";
import SetorScreen from "./components/SetorScreen";
import FuncionariosScreen from "./components/FuncionariosScreen";
import FilterOffcanvas from "./components/FilterOffcanvas";
import Login from "./components/LoginScreen";
import FunList from "./components/FuncionariosList";
import ProtectedRoute from "./components/ProtectedRoutes";
import IndicadoresPage from "./components/IndicadoresPage";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  const [showFilter, setShowFilter] = useState(false);
  const [showFuncionarios, setShowFuncionarios] = useState(false);
  const [setorPathId, setSetorPathId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      setShowFuncionarios(false);
    }
    const pathParts = location.pathname.split("/");

    if (pathParts.length > 3) {
      const departmentName = decodeURIComponent(pathParts[2]);
      setDepartmentName(departmentName);
      setSetorPathId(pathParts[pathParts.length - 1]);
    } else if (pathParts.length > 1) {
      setDepartmentName(pathParts[1]);
      setSetorPathId(pathParts[pathParts.length - 1]);
    } else {
      setDepartmentName(""); // Caso não haja nome de departamento
      setSetorPathId("mainscreen"); // Caso padrão
    }
  }, [location.pathname]);

  const handleCloseFilter = () => setShowFilter(false);
  const handleShowFilter = () => setShowFilter(true);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-100">
        {/* Renderiza o Header se não estiver na rota de login */}
        {location.pathname !== "/" && (
          <Header handleShowFilter={handleShowFilter} />
        )}

        {/* Checkbox para Mostrar Funcionários */}
        {location.pathname !== "/" &&
          !location.pathname.startsWith("/indicadores") &&
          !location.pathname.startsWith("/search") && (
            <div
              className="m-2 checkbox-container"
              style={{ top: 10, left: 10, zIndex: 1000 }}
            >
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
          <FunList setorPathId={setorPathId} departmentName={departmentName} />
        ) : (
          <>
            {/* Conteúdo de Rota */}
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/indicadores" element={<IndicadoresPage />} />
              <Route
                path="/mainscreen"
                element={
                  <ProtectedRoute>
                    <MainScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search/:searchTerm"
                element={
                  <ProtectedRoute>
                    <FunList
                      setorPathId={"search"}
                      departmentName={useParams().searchTerm}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:setorNome/:setorId/*"
                element={
                  <ProtectedRoute>
                    <SetorScreenWrapper />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </>
        )}
      </div>
    </QueryClientProvider>
  );

  // Wrapper para passar uma chave única com base na rota
  function SetorScreenWrapper() {
    const { setorId } = useParams();
    return <SetorScreen key={setorId} />;
  }
}

export default App;
