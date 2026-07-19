import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth, isElevatedRole, canManageUsers, getHomePath } from "@features/auth";
import { useTenant } from "@shared/context/TenantContext";

/**
 * @param {{
 *   collapsed?: boolean,
 *   open?: boolean,
 *   onNavigate?: () => void,
 *   onCreateFuncionario?: () => void,
 * }} props
 */
export default function Sidebar({
  collapsed = false,
  open = false,
  onNavigate,
  onCreateFuncionario,
}) {
  const { role } = useAuth();
  const { branding, vocabulary, isPlatform } = useTenant();
  const isElevated = isElevatedRole(role);
  const showUsers = canManageUsers(role);
  const isPlatformConsole = isPlatform && role === "superadmin";

  const displayName = isPlatformConsole
    ? "Console Master"
    : branding?.displayName || branding?.name || "Sistema";
  const logoUrl = isPlatformConsole ? null : branding?.logoUrl;
  const initial = displayName.charAt(0).toUpperCase();
  const funcionarioLabel = vocabulary?.funcionario || "funcionário";

  const handleNav = () => {
    onNavigate?.();
  };

  const linkClass = ({ isActive }) =>
    `sidebar__link${isActive ? " sidebar__link--active" : ""}`;

  const estruturaActive = ({ isActive }) =>
    `sidebar__link${isActive ? " sidebar__link--active" : ""}`;

  const homeTo = getHomePath({ isPlatform: isPlatformConsole, role });

  return (
    <aside
      className={`app-shell__sidebar${collapsed ? " app-shell__sidebar--collapsed" : ""}${
        open ? " app-shell__sidebar--open" : ""
      }`}
      aria-label="Navegação principal"
    >
      <div className="sidebar">
        <NavLink
          to={homeTo}
          className="sidebar__brand"
          onClick={handleNav}
          title={displayName}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="" className="sidebar__brand-logo" />
          ) : (
            <span className="sidebar__brand-fallback" aria-hidden="true">
              {initial}
            </span>
          )}
          <span className="sidebar__brand-text text-truncate">{displayName}</span>
        </NavLink>

        <nav className="sidebar__nav">
          {isPlatformConsole ? (
            <>
              <div className="sidebar__section-label">Plataforma</div>
              <NavLink to="/tenants" className={linkClass} onClick={handleNav} end>
                <i className="bi bi-buildings" aria-hidden="true" />
                <span className="sidebar__label">Tenants</span>
              </NavLink>
              <NavLink
                to="/tenants/new"
                className={linkClass}
                onClick={handleNav}
              >
                <i className="bi bi-plus-square" aria-hidden="true" />
                <span className="sidebar__label">Novo tenant</span>
              </NavLink>
            </>
          ) : (
            <>
              <div className="sidebar__section-label">Principal</div>

              {isElevated && (
                <NavLink to="/dashboard" className={linkClass} onClick={handleNav}>
                  <i className="bi bi-bar-chart-line" aria-hidden="true" />
                  <span className="sidebar__label">Dashboard</span>
                </NavLink>
              )}

              <NavLink
                to="/estrutura"
                className={estruturaActive}
                onClick={handleNav}
                end={false}
              >
                <i className="bi bi-diagram-3" aria-hidden="true" />
                <span className="sidebar__label">Estrutura</span>
              </NavLink>

              <button
                type="button"
                className="sidebar__link"
                onClick={() => {
                  onCreateFuncionario?.();
                  handleNav();
                }}
              >
                <i className="bi bi-person-plus" aria-hidden="true" />
                <span className="sidebar__label">
                  Novo {funcionarioLabel.toLowerCase()}
                </span>
              </button>

              {isElevated && (
                <>
                  <div className="sidebar__section-label">Administração</div>
                  {showUsers && (
                    <NavLink
                      to="/usuarios"
                      className={linkClass}
                      onClick={handleNav}
                    >
                      <i className="bi bi-people-fill" aria-hidden="true" />
                      <span className="sidebar__label">Usuários</span>
                    </NavLink>
                  )}
                  <NavLink
                    to="/cargos-comissionados"
                    className={linkClass}
                    onClick={handleNav}
                  >
                    <i className="bi bi-briefcase" aria-hidden="true" />
                    <span className="sidebar__label">Cargos comissionados</span>
                  </NavLink>
                  <NavLink
                    to="/indicadores"
                    className={linkClass}
                    onClick={handleNav}
                  >
                    <i className="bi bi-sliders" aria-hidden="true" />
                    <span className="sidebar__label">Referências</span>
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
