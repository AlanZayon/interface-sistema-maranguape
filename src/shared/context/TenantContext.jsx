import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import * as tenantsApi from "@shared/api/tenants";
import {
  resolveTenantSlugFromLocation,
  applyBrandingVars,
  applyPlatformBranding,
  resolveVocabulary,
  getActAsTenant,
} from "@shared/lib/tenant";
import { useAuth } from "@features/auth";

const TenantContext = createContext({
  tenant: null,
  branding: null,
  vocabulary: {},
  loading: false,
  error: null,
  slug: null,
  isPlatform: false,
});

export const useTenant = () => useContext(TenantContext);

export function useVocabulary() {
  const { vocabulary } = useTenant();
  return vocabulary;
}

export function TenantProvider({ children }) {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { slug, isPlatform } = useMemo(
    () => resolveTenantSlugFromLocation({ searchParams }),
    [searchParams]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isPlatform) {
          if (cancelled) return;
          setTenant(null);
          applyPlatformBranding();
          return;
        }

        let data = null;

        if (slug) {
          data = await tenantsApi.getBySlug(slug);
        } else if (isAuthenticated) {
          try {
            data = await tenantsApi.getMe();
          } catch {
            data = null;
          }
        }

        if (cancelled) return;
        setTenant(data);
        if (data?.branding || data) {
          applyBrandingVars(data?.branding || data);
        }
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
  }, [slug, isPlatform, isAuthenticated]);

  // After login on tenant host, refresh full /me payload (settings + branding)
  useEffect(() => {
    if (!isAuthenticated || isPlatform || !slug) return;
    let cancelled = false;

    (async () => {
      try {
        const me = await tenantsApi.getMe();
        if (cancelled || !me) return;
        setTenant(me);
        applyBrandingVars(me.branding || me);
      } catch {
        // keep by-slug branding
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPlatform, slug, role]);

  const branding = tenant?.branding || tenant || null;
  const vocabulary = resolveVocabulary(tenant?.settings);

  const value = {
    tenant,
    branding,
    vocabulary,
    loading,
    error,
    slug: slug || getActAsTenant(),
    isPlatform,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export default TenantContext;
