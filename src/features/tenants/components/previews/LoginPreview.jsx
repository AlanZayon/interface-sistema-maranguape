import React from "react";

/**
 * Mini login surface using production class names (.login-page, .btn-brand).
 */
export default function LoginPreview({ branding = {}, name = "" }) {
  const displayName = branding.displayName || name || "Preview";
  const initial = (displayName || "P").charAt(0).toUpperCase();
  const primary = branding.primaryColor || "#1a5f2a";
  const contrast = branding.primaryContrast || "#fff";

  return (
    <div className="login-page" style={{ minHeight: 320, padding: 16 }}>
      <div
        className="login-card card bg-white"
        style={{
          background: "var(--brand-surface)",
          borderColor: "var(--brand-border)",
          padding: 20,
          borderRadius: 8,
        }}
      >
        <div className="text-center mb-3">
          {branding.logoUrl ? (
            <img
              className="login-brand-logo"
              src={branding.logoUrl}
              alt=""
            />
          ) : (
            <span
              className="sidebar__brand-fallback mx-auto mb-2"
              style={{ width: 48, height: 48, fontSize: 18 }}
            >
              {initial}
            </span>
          )}
          <h6 className="mb-0" style={{ color: "var(--brand-text)" }}>
            {displayName}
          </h6>
          <p
            className="mb-0 mt-1"
            style={{ fontSize: 12, color: "var(--brand-muted)" }}
          >
            Acesse sua conta
          </p>
        </div>
        <div
          className="mb-2 rounded border px-2 py-1"
          style={{
            fontSize: 12,
            color: "var(--brand-muted)",
            borderColor: "var(--brand-border)",
            background: "var(--brand-bg)",
          }}
        >
          Usuário
        </div>
        <div
          className="mb-3 rounded border px-2 py-1"
          style={{
            fontSize: 12,
            color: "var(--brand-muted)",
            borderColor: "var(--brand-border)",
            background: "var(--brand-bg)",
          }}
        >
          Senha
        </div>
        <button
          type="button"
          className="btn-brand"
          style={{
            width: "100%",
            border: 0,
            borderRadius: 6,
            padding: "8px 12px",
            background: primary,
            color: contrast,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
