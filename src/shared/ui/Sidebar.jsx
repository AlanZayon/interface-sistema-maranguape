import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@features/auth";
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
  const { branding } = useTenant();
  const isAdmin = role === "admin";
  const displayName = branding?.displayName || branding?.name || "Sistema";
  const logoUrl = branding?.logoUrl;
  const initial = displayName.charAt(0).toUpperCase();

  const handleNav = () => {
    onNavigate?.();
  };

  const linkClass = ({ isActive }) =>
    `sidebar__link${isActive ? " sidebar__link--active" : ""}`;

  const estruturaActive = ({ isActive }) =>
    `sidebar__link${isActive ? " sidebar__link--active" : ""}`;

  return (
    <aside
      className={`app-shell__sidebar${collapsed ? " app-shell__sidebar--collapsed" : ""}${
        open ? " app-shell__sidebar--open" : ""
      }`}
      aria-label="Navegação principal"
    >
      <div className="sidebar">
        <NavLink
          to="/estrutura"
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
          <div className="sidebar__section-label">Principal</div>

          <NavLink
            to="/estrutura"
            className={estruturaActive}
            onClick={handleNav}
            end={false}
          >
            <i className="bi bi-diagram-3" aria-hidden="true" />
            <span className="sidebar__label">Estrutura</span>
          </NavLink>

          <NavLink to="/dashboard" className={linkClass} onClick={handleNav}>
            <i className="bi bi-bar-chart-line" aria-hidden="true" />
            <span className="sidebar__label">Dashboard</span>
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
            <span className="sidebar__label">Novo funcionário</span>
          </button>

          {isAdmin && (
            <>
              <div className="sidebar__section-label">Administração</div>
              <NavLink to="/usuarios" className={linkClass} onClick={handleNav}>
                <i className="bi bi-people-fill" aria-hidden="true" />
                <span className="sidebar__label">Usuários</span>
              </NavLink>
              <NavLink to="/indicadores" className={linkClass} onClick={handleNav}>
                <i className="bi bi-sliders" aria-hidden="true" />
                <span className="sidebar__label">Referências</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
