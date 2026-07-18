import React from "react";
import {
  Routes,
  Route,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppShell } from "@shared/ui";
import { EstruturaPage, LegacySetorRedirect } from "@features/setores";
import { LoginScreen, ProtectedRoute } from "@features/auth";
import { FuncionariosList } from "@features/funcionarios";
import { IndicadoresPage } from "@features/referencias";
import { DashboardPage } from "@features/dashboard";
import { UsersPage } from "@features/users";
import { CargosPage } from "@features/cargos";
import { RelatorioPreviewPage } from "@features/relatorios";
import "@shared/styles/shell.css";
import "@shared/styles/App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function SearchFunListWrapper() {
  const { searchTerm } = useParams();
  return <FuncionariosList setorPathId="search" departmentName={searchTerm} />;
}

function FunListSelectedWrapper() {
  const location = useLocation();
  const idsDivisoes = location.state?.idsDivisoes ?? [];

  return (
    <FuncionariosList
      setorPathId="selected"
      departmentName="SELECIONADOS"
      idsDivisoes={idsDivisoes}
    />
  );
}

function ProtectedShell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-100">
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route
            path="/indicadores"
            element={
              <ProtectedShell>
                <IndicadoresPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedShell>
                <DashboardPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedShell>
                <UsersPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/cargos-comissionados"
            element={
              <ProtectedShell>
                <CargosPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/estrutura"
            element={
              <ProtectedShell>
                <EstruturaPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/estrutura/:nodeId"
            element={
              <ProtectedShell>
                <EstruturaPage />
              </ProtectedShell>
            }
          />
          <Route
            path="/mainscreen"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/search/:searchTerm"
            element={
              <ProtectedShell>
                <SearchFunListWrapper />
              </ProtectedShell>
            }
          />
          <Route
            path="/selected"
            element={
              <ProtectedShell>
                <FunListSelectedWrapper />
              </ProtectedShell>
            }
          />
          <Route
            path="/relatorios/preview"
            element={
              <ProtectedRoute>
                <RelatorioPreviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:setorNome/:setorId/*"
            element={
              <ProtectedShell>
                <LegacySetorRedirect />
              </ProtectedShell>
            }
          />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </div>
    </QueryClientProvider>
  );
}

export default App;
