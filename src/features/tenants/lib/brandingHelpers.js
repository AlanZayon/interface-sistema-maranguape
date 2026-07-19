/**
 * Shared branding helpers for wizard preview + policy-driven forms.
 */

export const DEFAULT_BRANDING_POLICY = {
  customCssEnabled: true,
  customCssMaxLength: 20_000,
  allowedSelectors: [
    ".login-page",
    ".login-card",
    ".sidebar",
    ".app-header",
    ".app-shell",
    ".btn-brand",
    ".dashboard-page",
    ".dashboard-stat",
  ],
  editableFields: [
    "logoUrl",
    "faviconUrl",
    "displayName",
    "primaryColor",
    "secondaryColor",
    "primaryContrast",
    "headerBg",
    "headerText",
    "sidebarBg",
    "sidebarText",
    "surfaceBg",
    "pageBg",
    "textColor",
    "mutedColor",
    "borderColor",
    "fontFamily",
    "fontUrl",
    "themeMode",
    "customCss",
  ],
  fontUrlHosts: ["fonts.googleapis.com", "fonts.gstatic.com"],
  assetMaxBytes: 2 * 1024 * 1024,
  colorFields: [
    "primaryColor",
    "secondaryColor",
    "primaryContrast",
    "headerBg",
    "headerText",
    "sidebarBg",
    "sidebarText",
    "surfaceBg",
    "pageBg",
    "textColor",
    "mutedColor",
    "borderColor",
  ],
};

export const COLOR_PICKER_LABELS = [
  ["primaryColor", "Primária"],
  ["secondaryColor", "Secundária"],
  ["primaryContrast", "Contraste"],
  ["headerBg", "Header fundo"],
  ["headerText", "Header texto"],
  ["sidebarBg", "Sidebar fundo"],
  ["sidebarText", "Sidebar texto"],
  ["surfaceBg", "Superfície"],
  ["pageBg", "Fundo página"],
  ["textColor", "Texto"],
  ["mutedColor", "Texto muted"],
  ["borderColor", "Borda"],
];

/**
 * Default custom CSS for wizard — targets the same classes used in
 * Login / Shell / Dashboard previews (and production shell).
 */
export const DEFAULT_CUSTOM_CSS = `/* ——— Login ——— */
.login-page .login-card {
  border-radius: 12px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--brand-primary) 12%, transparent);
}

.login-page .login-brand-logo {
  max-height: 64px;
}

.login-page .btn-brand {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

/* ——— Shell (header + sidebar) ——— */
.app-shell__header,
.app-header {
  letter-spacing: 0.01em;
}

.sidebar__brand-text {
  letter-spacing: 0.02em;
  font-weight: 600;
}

.sidebar__link--active {
  font-weight: 700;
}

.sidebar__link:hover {
  background: color-mix(in srgb, var(--brand-primary) 8%, transparent);
}

/* ——— Dashboard ——— */
.dashboard-page .dashboard-stat {
  border-radius: 10px;
  box-shadow: 0 1px 3px color-mix(in srgb, var(--brand-text) 6%, transparent);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.dashboard-page .dashboard-stat:hover {
  border-color: color-mix(in srgb, var(--brand-primary) 45%, var(--brand-border));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--brand-primary) 14%, transparent);
}

.dashboard-page .btn-brand {
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
`;

export function isEditableField(policy, field) {
  const fields = policy?.editableFields || DEFAULT_BRANDING_POLICY.editableFields;
  return fields.includes(field);
}

export function brandingCssVars(branding = {}) {
  const primary = branding.primaryColor || "#1a5f2a";
  const vars = {
    "--brand-primary": primary,
    "--brand-primary-contrast": branding.primaryContrast || "#ffffff",
    "--brand-secondary": branding.secondaryColor || "#0d6efd",
    "--brand-bg": branding.pageBg || "#f3f4f6",
    "--brand-surface": branding.surfaceBg || "#ffffff",
    "--brand-text": branding.textColor || "#212529",
    "--brand-muted": branding.mutedColor || "#6c757d",
    "--brand-border": branding.borderColor || "#dee2e6",
    "--header-bg": branding.headerBg || "#1b1f24",
    "--header-text": branding.headerText || "#f8f9fa",
    "--sidebar-bg": branding.sidebarBg || "#ffffff",
    "--sidebar-text": branding.sidebarText || "#343a40",
    "--sidebar-active-bg": `color-mix(in srgb, ${primary} 12%, transparent)`,
    "--sidebar-active-border": primary,
    "--focus-ring": `0 0 0 0.2rem color-mix(in srgb, ${primary} 35%, transparent)`,
    "--font-family": branding.fontFamily || "system-ui, sans-serif",
  };
  if (branding.logoUrl) {
    vars["--brand-logo-url"] = `url(${branding.logoUrl})`;
  }
  if (branding.displayName) {
    vars["--brand-display-name"] = `"${branding.displayName}"`;
  }
  return vars;
}

/**
 * Scope CSS rules under a root selector. Preserves @media / @supports blocks.
 */
export function scopeCustomCss(css, rootSelector) {
  const raw = String(css || "").trim();
  if (!raw) return "";

  const out = [];
  let i = 0;

  while (i < raw.length) {
    if (/\s/.test(raw[i])) {
      i += 1;
      continue;
    }
    if (raw[i] === "/" && raw[i + 1] === "*") {
      const end = raw.indexOf("*/", i + 2);
      if (end === -1) break;
      out.push(raw.slice(i, end + 2));
      i = end + 2;
      continue;
    }

    if (raw[i] === "@") {
      const brace = raw.indexOf("{", i);
      if (brace === -1) break;
      const header = raw.slice(i, brace).trim();
      let depth = 1;
      let j = brace + 1;
      while (j < raw.length && depth > 0) {
        if (raw[j] === "{") depth += 1;
        else if (raw[j] === "}") depth -= 1;
        j += 1;
      }
      const inner = raw.slice(brace + 1, j - 1);
      if (/^@(media|supports)\b/i.test(header)) {
        const scopedInner = scopeCustomCss(inner, rootSelector);
        if (scopedInner.trim()) {
          out.push(`${header} { ${scopedInner} }`);
        }
      }
      i = j;
      continue;
    }

    const brace = raw.indexOf("{", i);
    if (brace === -1) break;
    const selectorsRaw = raw.slice(i, brace).trim();
    let depth = 1;
    let j = brace + 1;
    while (j < raw.length && depth > 0) {
      if (raw[j] === "{") depth += 1;
      else if (raw[j] === "}") depth -= 1;
      j += 1;
    }
    const body = raw.slice(brace + 1, j - 1);
    const scopedSelectors = selectorsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) =>
        s.startsWith(rootSelector) ? s : `${rootSelector} ${s}`
      )
      .join(", ");
    if (scopedSelectors) {
      out.push(`${scopedSelectors} { ${body.trim()} }`);
    }
    i = j;
  }

  return out.join("\n");
}
