import axios from "axios";
import {
  resolveTenantSlugFromLocation,
  getActAsTenant,
} from "@shared/lib/tenant";

const AUTH_STORAGE_KEYS = ["isAuthenticated", "username", "role"];

function clearAuthStorage() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

/**
 * In DEV, call /api via Vite proxy (same origin as the page host).
 * That keeps auth cookies working on master.localhost / slug.localhost.
 * In production, use VITE_API_BASE_URL directly.
 */
function resolveApiBaseUrl() {
  if (import.meta.env.DEV) {
    return "";
  }
  return import.meta.env.VITE_API_BASE_URL || "";
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const { slug, isPlatform } = resolveTenantSlugFromLocation({
    searchParams: new URLSearchParams(window.location.search),
  });

  if (slug && !isPlatform) {
    config.headers["X-Tenant-Slug"] = slug;
  }

  const actAs = getActAsTenant();
  if (actAs) {
    config.headers["X-Act-As-Tenant"] = actAs;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthEndpoint =
      url.includes("/api/usuarios/login") ||
      url.includes("/api/usuarios/logout") ||
      url.includes("/api/usuarios/verify");

    if (status === 401 && !isAuthEndpoint) {
      clearAuthStorage();
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { clearAuthStorage };
