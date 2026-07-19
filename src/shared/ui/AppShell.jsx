import React, { useState, useEffect, createContext, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";
import CreateFuncionarioModal from "./CreateFuncionarioModal";
import { useAuth } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";

const ShellActionsContext = createContext({
  openOrganogram: () => {},
  openFuncionariosSelect: () => {},
  openCreateFuncionario: (_setorId, _secretaria) => {},
});

export function useShellActions() {
  return useContext(ShellActionsContext);
}

/**
 * Layout shell for authenticated routes.
 * @param {{ children: React.ReactNode }} props
 */
export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { isPlatform } = useTenant();
  const isPlatformConsole = isPlatform && role === "superadmin";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCreateFuncionario, setShowCreateFuncionario] = useState(false);
  const [createCoordId, setCreateCoordId] = useState(null);
  const [createSecretaria, setCreateSecretaria] = useState("");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const actions = {
    openOrganogram: () => {
      if (!isPlatformConsole) navigate("/estrutura?view=organograma");
    },
    openFuncionariosSelect: () => {
      if (!isPlatformConsole) navigate("/estrutura?view=funcionarios");
    },
    openCreateFuncionario: (setorId = null, secretaria = "") => {
      if (isPlatformConsole) return;
      setCreateCoordId(setorId || null);
      setCreateSecretaria(secretaria || "");
      setShowCreateFuncionario(true);
    },
  };

  return (
    <ShellActionsContext.Provider value={actions}>
      <div className="app-shell">
        {mobileOpen && (
          <div
            className="app-shell__overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          collapsed={sidebarCollapsed}
          open={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
          onCreateFuncionario={
            isPlatformConsole ? undefined : () => actions.openCreateFuncionario()
          }
        />

        <div className="app-shell__main">
          <AppHeader onToggleSidebar={toggleSidebar} />
          {isPlatformConsole && (
            <div
              className="px-3 py-2 small"
              style={{
                background: "var(--brand-primary)",
                color: "var(--brand-primary-contrast)",
              }}
            >
              Console master — gestão de tenants da plataforma (sem dados municipais)
            </div>
          )}
          <main className="app-shell__content">{children}</main>
        </div>

        {!isPlatformConsole && (
          <CreateFuncionarioModal
            show={showCreateFuncionario}
            onHide={() => setShowCreateFuncionario(false)}
            initialSetorId={createCoordId}
            initialSecretaria={createSecretaria}
          />
        )}
      </div>
    </ShellActionsContext.Provider>
  );
}
