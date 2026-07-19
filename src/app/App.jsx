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
import {
  LoginScreen,
  ProtectedRoute,
  RequireRole,
  RouteModeGuard,
  getHomePath,
  useAuth,
} from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";
import { FuncionariosList } from "@features/funcionarios";
import { IndicadoresPage } from "@features/referencias";
import { DashboardPage } from "@features/dashboard";
import { UsersPage } from "@features/users";
import { CargosPage } from "@features/cargos";
import { RelatorioPreviewPage } from "@features/relatorios";
import {
  TenantsPage,
  TenantWizardPage,
  TenantDetailPage,
} from "@features/tenants";
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

function TenantShell({ children }) {
  return (
    <ProtectedRoute>
      <RouteModeGuard mode="tenant">
        <AppShell>{children}</AppShell>
      </RouteModeGuard>
    </ProtectedRoute>
  );
}

function PlatformShell({ children }) {
  return (
    <ProtectedRoute>
      <RouteModeGuard mode="platform">
        <AppShell>{children}</AppShell>
      </RouteModeGuard>
    </ProtectedRoute>
  );
}

function TenantHomeRedirect() {
  const { isAuthenticated, role } = useAuth();
  const { isPlatform } = useTenant();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={getHomePath({ isPlatform, role })} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-100">
        <Routes>
          <Route path="/" element={<LoginScreen />} />

          {/* Console master — só gestão de tenants */}
          <Route
            path="/tenants"
            element={
              <PlatformShell>
                <TenantsPage />
              </PlatformShell>
            }
          />
          <Route
            path="/tenants/new"
            element={
              <PlatformShell>
                <TenantWizardPage />
              </PlatformShell>
            }
          />
          <Route
            path="/tenants/:id"
            element={
              <PlatformShell>
                <TenantDetailPage />
              </PlatformShell>
            }
          />

          {/* App municipal do tenant */}
          <Route
            path="/dashboard"
            element={
              <TenantShell>
                <RequireRole roles={["owner", "admin", "superadmin"]}>
                  <DashboardPage />
                </RequireRole>
              </TenantShell>
            }
          />
          <Route
            path="/usuarios"
            element={
              <TenantShell>
                <RequireRole roles={["owner", "superadmin"]}>
                  <UsersPage />
                </RequireRole>
              </TenantShell>
            }
          />
          <Route
            path="/cargos-comissionados"
            element={
              <TenantShell>
                <RequireRole roles={["owner", "admin", "superadmin"]}>
                  <CargosPage />
                </RequireRole>
              </TenantShell>
            }
          />
          <Route
            path="/indicadores"
            element={
              <TenantShell>
                <RequireRole roles={["owner", "admin", "superadmin"]}>
                  <IndicadoresPage />
                </RequireRole>
              </TenantShell>
            }
          />
          <Route
            path="/estrutura"
            element={
              <TenantShell>
                <EstruturaPage />
              </TenantShell>
            }
          />
          <Route
            path="/estrutura/:nodeId"
            element={
              <TenantShell>
                <EstruturaPage />
              </TenantShell>
            }
          />
          <Route path="/mainscreen" element={<TenantHomeRedirect />} />
          <Route
            path="/search/:searchTerm"
            element={
              <TenantShell>
                <SearchFunListWrapper />
              </TenantShell>
            }
          />
          <Route
            path="/selected"
            element={
              <TenantShell>
                <FunListSelectedWrapper />
              </TenantShell>
            }
          />
          <Route
            path="/relatorios/preview"
            element={
              <ProtectedRoute>
                <RouteModeGuard mode="tenant">
                  <RelatorioPreviewPage />
                </RouteModeGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/:setorNome/:setorId/*"
            element={
              <TenantShell>
                <LegacySetorRedirect />
              </TenantShell>
            }
          />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </div>
    </QueryClientProvider>
  );
}

export default App;
