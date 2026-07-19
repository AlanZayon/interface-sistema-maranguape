const RESERVED_SUBDOMAINS = new Set([
  "master",
  "www",
  "app",
  "api",
  "localhost",
  "admin",
  "static",
  "assets",
]);

const DEFAULT_VOCABULARY = {
  funcionario: "Funcionário",
  setor: "Setor",
  subsetor: "Subsetor",
  cargo: "Cargo",
  referencia: "Referência",
};

/** Branding do console master (host da plataforma / superadmin). */
export const PLATFORM_BRANDING = {
  displayName: "Console Master",
  faviconUrl: "/favicon.svg",
};

export function getBaseDomain() {
  return (import.meta.env.VITE_BASE_DOMAIN || "").trim().toLowerCase();
}

export function getMasterSubdomain() {
  return (import.meta.env.VITE_MASTER_SUBDOMAIN || "master").trim().toLowerCase();
}

export function isDev() {
  return import.meta.env.DEV;
}

/**
 * Resolve tenant slug from hostname subdomain, with optional dev fallbacks.
 */
export function resolveTenantSlugFromLocation({
  searchParams,
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
} = {}) {
  const master = getMasterSubdomain();
  const baseDomain = getBaseDomain();
  const host = String(hostname || "")
    .split(":")[0]
    .toLowerCase()
    .trim();

  if (!host) return { slug: null, isPlatform: false };

  // Platform master host
  if (
    host === `${master}.localhost` ||
    (baseDomain && host === `${master}.${baseDomain}`) ||
    host.startsWith(`${master}.`)
  ) {
    return { slug: null, isPlatform: true };
  }

  // *.localhost
  if (host.endsWith(".localhost")) {
    const sub = host.replace(/\.localhost$/, "");
    if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
      return { slug: sub, isPlatform: false };
    }
    return { slug: null, isPlatform: false };
  }

  if (baseDomain) {
    if (host === baseDomain || host === `www.${baseDomain}`) {
      return { slug: null, isPlatform: false };
    }
    if (host.endsWith(`.${baseDomain}`)) {
      const sub = host.slice(0, -(baseDomain.length + 1));
      if (sub && !sub.includes(".") && !RESERVED_SUBDOMAINS.has(sub)) {
        return { slug: sub, isPlatform: false };
      }
    }
  } else {
    const parts = host.split(".");
    if (parts.length >= 3) {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) {
        return { slug: sub, isPlatform: false };
      }
    }
  }

  // Dev fallbacks only
  if (isDev()) {
    const fromQuery = searchParams?.get?.("tenant")?.trim();
    if (fromQuery) return { slug: fromQuery, isPlatform: false };
    const fromEnv = (import.meta.env.VITE_TENANT_SLUG || "").trim();
    if (fromEnv) return { slug: fromEnv, isPlatform: false };
  }

  return { slug: null, isPlatform: false };
}

export function getActAsTenant() {
  try {
    return sessionStorage.getItem("actAsTenant") || null;
  } catch {
    return null;
  }
}

export function setActAsTenant(slug) {
  try {
    if (slug) sessionStorage.setItem("actAsTenant", slug);
    else sessionStorage.removeItem("actAsTenant");
  } catch {
    // ignore
  }
}

export function tenantHostUrl(slug, path = "/") {
  const baseDomain = getBaseDomain();
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "https:";
  const port =
    typeof window !== "undefined" && window.location.port
      ? `:${window.location.port}`
      : "";

  if (baseDomain) {
    return `${protocol}//${slug}.${baseDomain}${port}${path}`;
  }
  // local default
  return `${protocol}//${slug}.localhost${port}${path}`;
}

export function applyPlatformBranding() {
  applyBrandingVars(PLATFORM_BRANDING);
}

export function applyBrandingVars(branding) {
  if (!branding) return;
  const root = document.documentElement;

  const map = {
    primaryColor: "--brand-primary",
    secondaryColor: "--brand-secondary",
    primaryContrast: "--brand-primary-contrast",
    pageBg: "--brand-bg",
    surfaceBg: "--brand-surface",
    textColor: "--brand-text",
    mutedColor: "--brand-muted",
    borderColor: "--brand-border",
    headerBg: "--header-bg",
    headerText: "--header-text",
    sidebarBg: "--sidebar-bg",
    sidebarText: "--sidebar-text",
  };

  Object.entries(map).forEach(([key, cssVar]) => {
    if (branding[key]) {
      root.style.setProperty(cssVar, branding[key]);
    }
  });

  if (branding.primaryColor) {
    root.style.setProperty(
      "--sidebar-active-bg",
      `color-mix(in srgb, ${branding.primaryColor} 12%, transparent)`
    );
    root.style.setProperty("--sidebar-active-border", branding.primaryColor);
    root.style.setProperty(
      "--focus-ring",
      `0 0 0 0.2rem color-mix(in srgb, ${branding.primaryColor} 35%, transparent)`
    );
  }

  if (branding.logoUrl) {
    root.style.setProperty("--brand-logo-url", `url(${branding.logoUrl})`);
  }

  if (branding.displayName) {
    root.style.setProperty(
      "--brand-display-name",
      `"${branding.displayName}"`
    );
    document.title = branding.displayName;
  }

  if (branding.fontFamily) {
    root.style.setProperty("--font-family", branding.fontFamily);
    document.body.style.fontFamily = branding.fontFamily;
  }

  root.setAttribute("data-theme", branding.themeMode === "dark" ? "dark" : "light");

  applyFavicon(branding.faviconUrl);
  applyFontUrl(branding.fontUrl);
  applyCustomCss(branding.customCss);
}

const DEFAULT_FAVICON = "/favicon.svg";

function applyFavicon(url) {
  // Substitui o <link rel="icon"> existente. Adicionar um segundo link
  // é ignorado por vários navegadores (ficavam só com o do index.html).
  const href = url || DEFAULT_FAVICON;
  const isSvg = /\.svg(\?|$)/i.test(href) || href.startsWith("data:image/svg");

  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((el) => el.remove());

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = isSvg ? "image/svg+xml" : "image/png";
  link.href = href;
  document.head.appendChild(link);
}

function applyFontUrl(fontUrl) {
  let link = document.querySelector("link[data-tenant-font]");
  if (!fontUrl) {
    if (link) link.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-tenant-font", "true");
    document.head.appendChild(link);
  }
  link.href = fontUrl;
}

function applyCustomCss(css) {
  let style = document.getElementById("tenant-custom-css");
  if (!css) {
    if (style) style.remove();
    return;
  }
  if (!style) {
    style = document.createElement("style");
    style.id = "tenant-custom-css";
    document.head.appendChild(style);
  }
  style.textContent = `/* tenant customCss (sanitized by API policy) */\n${css}`;
}

export function resolveVocabulary(settings) {
  return {
    ...DEFAULT_VOCABULARY,
    ...(settings?.vocabulary || {}),
  };
}

export { DEFAULT_VOCABULARY, RESERVED_SUBDOMAINS };
