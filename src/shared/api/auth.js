import apiClient from "./client";

export const login = (id, password) =>
  apiClient.post("/api/usuarios/login", { id, password }).then((r) => r.data);

export const logout = () =>
  apiClient.post("/api/usuarios/logout", {}).then((r) => r.data);

export const verify = () =>
  apiClient.get("/api/usuarios/verify").then((r) => r.data);
