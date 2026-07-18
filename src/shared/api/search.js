import apiClient from "./client";

export const autocomplete = (q) =>
  apiClient.get("/api/search/autocomplete", { params: { q } }).then((r) => r.data);

export const searchFuncionarios = (q) =>
  apiClient
    .get("/api/search/search-funcionarios", { params: { q } })
    .then((r) => r.data);
