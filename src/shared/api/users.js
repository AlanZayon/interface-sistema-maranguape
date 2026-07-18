import apiClient from "./client";

export const listUsers = () =>
  apiClient.get("/api/usuarios/manage").then((r) => r.data);

export const createUser = (data) =>
  apiClient.post("/api/usuarios/manage", data).then((r) => r.data);

export const updateUser = (id, data) =>
  apiClient.put(`/api/usuarios/manage/${id}`, data).then((r) => r.data);

export const deleteUser = (id) =>
  apiClient.delete(`/api/usuarios/manage/${id}`).then((r) => r.data);
