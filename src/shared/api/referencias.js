import apiClient from "./client";

export const getReferencias = () =>
  apiClient.get("/api/referencias/referencias-dados").then((r) => r.data);

export const createReferencia = (formData) =>
  apiClient
    .post("/api/referencias/register-reference", formData)
    .then((r) => r.data);

export const deleteReferencia = (id) =>
  apiClient
    .delete(`/api/referencias/delete-referencia/${id}`)
    .then((r) => r.data);
