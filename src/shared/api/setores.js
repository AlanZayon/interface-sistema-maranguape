import apiClient from "./client";

export const getMainSetores = () =>
  apiClient.get("/api/setores/setoresMain").then((r) => r.data);

export const getSetoresOrganizados = () =>
  apiClient.get("/api/setores/setoresOrganizados").then((r) => r.data);

export const getSetorData = (setorId) =>
  apiClient.get(`/api/setores/dados/${setorId}`).then((r) => r.data);

export const createSetor = (data) =>
  apiClient.post("/api/setores", data).then((r) => r.data);

export const renameSetor = (id, nome) =>
  apiClient.put(`/api/setores/rename/${id}`, { nome }).then((r) => r.data);

export const moveSetor = (id, parent) =>
  apiClient
    .put(`/api/setores/${id}/parent`, { parent: parent ?? null })
    .then((r) => r.data);

export const deleteSetor = (id) =>
  apiClient.delete(`/api/setores/del/${id}`).then((r) => r.data);
