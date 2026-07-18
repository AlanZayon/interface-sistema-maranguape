import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import * as tenantsApi from '@shared/api/tenants';

const TenantContext = createContext({
  tenant: null,
  branding: null,
  loading: false,
  error: null,
});

export const useTenant = () => useContext(TenantContext);

function applyBrandingVars(branding) {
  if (!branding) return;
  const root = document.documentElement;

  if (branding.primaryColor) {
    root.style.setProperty("--brand-primary", branding.primaryColor);
  }
  if (branding.logoUrl) {
    root.style.setProperty("--brand-logo-url", `url(${branding.logoUrl})`);
  }
  if (branding.displayName) {
    root.style.setProperty("--brand-display-name", `"${branding.displayName}"`);
    document.title = branding.displayName;
  }
}

function resolveTenantSlug(searchParams) {
  const fromQuery = searchParams.get("tenant")?.trim();
  if (fromQuery) return fromQuery;
  const fromEnv = (import.meta.env.VITE_TENANT_SLUG || "").trim();
  return fromEnv || null;
}

export function TenantProvider({ children }) {
  const [searchParams] = useSearchParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const slug = resolveTenantSlug(searchParams);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!slug) {
        setTenant(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await tenantsApi.getBySlug(slug);
        if (cancelled) return;
        setTenant(data);
        applyBrandingVars(data?.branding || data);
      } catch (err) {
        if (cancelled) return;
        console.error("Erro ao carregar tenant:", err);
        setError(err);
        setTenant(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const branding = tenant?.branding || tenant || null;

  return (
    <TenantContext.Provider value={{ tenant, branding, loading, error, slug }}>
      {children}
    </TenantContext.Provider>
  );
}

export default TenantContext;
