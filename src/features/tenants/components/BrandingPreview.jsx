import React, { useEffect, useId, useMemo, useState } from "react";
import {
  brandingCssVars,
  scopeCustomCss,
} from "../lib/brandingHelpers";
import LoginPreview from "./previews/LoginPreview";
import ShellPreview from "./previews/ShellPreview";
import DashboardPreview from "./previews/DashboardPreview";

const TABS = [
  { id: "login", label: "Login" },
  { id: "shell", label: "Shell" },
  { id: "dashboard", label: "Dashboard" },
];

/**
 * Multi-surface white-label preview — styles scoped to this component only.
 */
export default function BrandingPreview({ branding = {}, name = "" }) {
  const [tab, setTab] = useState("shell");
  const reactId = useId().replace(/:/g, "");
  const fontLinkId = `tenant-wizard-preview-font-${reactId}`;
  const displayName = branding.displayName || name || "Preview";
  const primary = branding.primaryColor || "#1a5f2a";
  const cssVars = useMemo(() => brandingCssVars(branding), [branding]);

  useEffect(() => {
    let link = document.getElementById(fontLinkId);
    if (!branding.fontUrl) {
      if (link) link.remove();
      return () => {
        document.getElementById(fontLinkId)?.remove();
      };
    }
    if (!link) {
      link = document.createElement("link");
      link.id = fontLinkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = branding.fontUrl;
    return () => {
      document.getElementById(fontLinkId)?.remove();
    };
  }, [branding.fontUrl, fontLinkId]);

  const scopedCustomCss = useMemo(
    () => scopeCustomCss(branding.customCss, ".tenant-branding-preview"),
    [branding.customCss]
  );

  return (
    <div className="tenant-branding-preview-wrap">
      {scopedCustomCss ? <style>{scopedCustomCss}</style> : null}

      <div
        className="d-flex align-items-center gap-2 px-2 py-1 border border-bottom-0 rounded-top bg-light"
        style={{ fontSize: 12 }}
      >
        <span className="d-flex align-items-center gap-1 text-muted">
          {branding.faviconUrl ? (
            <img
              src={branding.faviconUrl}
              alt=""
              width={14}
              height={14}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: primary,
                display: "inline-block",
              }}
            />
          )}
          <span className="text-truncate" style={{ maxWidth: 220 }}>
            {displayName}
          </span>
        </span>
      </div>

      <div
        className="d-flex border border-bottom-0 bg-white"
        style={{ fontSize: 12 }}
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className="btn btn-sm rounded-0 border-0 flex-fill"
            style={{
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? primary : "#6c757d",
              borderBottom:
                tab === t.id ? `2px solid ${primary}` : "2px solid transparent",
              background: "transparent",
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="tenant-branding-preview border rounded-bottom overflow-hidden"
        data-theme={branding.themeMode === "dark" ? "dark" : "light"}
        style={{
          ...cssVars,
          background: "var(--brand-bg)",
          color: "var(--brand-text)",
          fontFamily: "var(--font-family)",
          minHeight: 360,
          height: 360,
          overflow: "auto",
        }}
      >
        {tab === "login" && (
          <LoginPreview branding={branding} name={name} />
        )}
        {tab === "shell" && (
          <ShellPreview branding={branding} name={name} />
        )}
        {tab === "dashboard" && (
          <DashboardPreview branding={branding} name={name} />
        )}
      </div>
    </div>
  );
}
