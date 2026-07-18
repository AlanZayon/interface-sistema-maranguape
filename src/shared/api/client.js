import axios from "axios";

const AUTH_STORAGE_KEYS = ["isAuthenticated", "username", "role"];

function clearAuthStorage() {
  AUTH_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const fromEnv = (import.meta.env.VITE_TENANT_SLUG || "").trim();
  const fromQuery = new URLSearchParams(window.location.search)
    .get("tenant")
    ?.trim();
  const slug = fromQuery || fromEnv;
  if (slug) {
    config.headers["X-Tenant-Slug"] = slug;
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

    // Don't hijack failed login attempts — let the form show the API message
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
