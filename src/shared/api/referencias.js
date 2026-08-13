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

export const updateReferencia = (id, payload) =>
  apiClient.patch(`/api/referencias/${id}`, payload).then((r) => r.data);

/** Árvore completa do tenant (raízes -> ... -> funcionários folha). */
export const getArvore = () =>
  apiClient.get("/api/referencias/arvore").then((r) => r.data);

/** Cadeia raiz -> ... -> referência. */
export const getAncestrais = (id) =>
  apiClient.get(`/api/referencias/${id}/ancestrais`).then((r) => r.data);

/** Subárvore a partir de uma referência. */
export const getDescendentes = (id) =>
  apiClient.get(`/api/referencias/${id}/descendentes`).then((r) => r.data);

/** Cadeia raiz -> ... -> referência -> funcionário. */
export const getCadeiaFuncionario = (funcionarioId) =>
  apiClient
    .get(`/api/referencias/funcionario/${funcionarioId}/cadeia`)
    .then((r) => r.data);

export const getImpactoExclusao = (id) =>
  apiClient.get(`/api/referencias/${id}/impacto-exclusao`).then((r) => r.data);
