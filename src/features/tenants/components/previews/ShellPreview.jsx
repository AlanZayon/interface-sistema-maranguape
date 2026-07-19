import React from "react";

/**
 * Mini app shell using production sidebar / header class names.
 */
export default function ShellPreview({ branding = {}, name = "" }) {
  const displayName = branding.displayName || name || "Preview";
  const initial = (displayName || "P").charAt(0).toUpperCase();

  return (
    <div
      className="app-shell"
      style={{
        minHeight: 320,
        height: 360,
        display: "flex",
        flexDirection: "column",
        background: "var(--brand-bg)",
      }}
    >
      <header
        className="app-shell__header app-header"
        style={{
          position: "relative",
          height: 40,
          background: "var(--header-bg)",
          color: "var(--header-text)",
          padding: "0 12px",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span className="text-truncate">{displayName}</span>
        <span
          className="app-header__user-avatar"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--brand-primary)",
            color: "var(--brand-primary-contrast)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          A
        </span>
      </header>
      <div
        className="app-shell__main"
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <aside
          className="app-shell__sidebar"
          style={{
            position: "relative",
            height: "auto",
            width: 140,
            flexShrink: 0,
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--brand-border)",
          }}
        >
          <div className="sidebar" style={{ height: "100%", padding: "8px 0" }}>
            <div
              className="sidebar__brand"
              style={{ padding: "4px 12px", marginBottom: 8 }}
            >
              {branding.logoUrl ? (
                <img
                  className="sidebar__brand-logo"
                  src={branding.logoUrl}
                  alt=""
                />
              ) : (
                <span className="sidebar__brand-fallback">{initial}</span>
              )}
              <strong
                className="sidebar__brand-text text-truncate"
                style={{ fontSize: 12 }}
              >
                {displayName}
              </strong>
            </div>
            <nav className="sidebar__nav" style={{ padding: "0 8px" }}>
              <div
                className="sidebar__link sidebar__link--active"
                style={{ fontSize: 12 }}
              >
                <span className="sidebar__label">Dashboard</span>
              </div>
              <div className="sidebar__link" style={{ fontSize: 12 }}>
                <span className="sidebar__label">Funcionários</span>
              </div>
            </nav>
          </div>
        </aside>
        <main
          className="app-shell__content"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 12,
            background: "var(--brand-bg)",
            color: "var(--brand-text)",
          }}
        >
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
            }}
          >
            Conteúdo do shell
          </div>
        </main>
      </div>
    </div>
  );
}
