import apiClient from "./client";

export const buscarFuncionarios = (params = {}) =>
  apiClient.get("/api/funcionarios/buscarFuncionarios", { params }).then((r) => r.data);

/**
 * Listagem paginada para seleção (referências, etc.).
 * @param {{ q?: string, natureza?: string, secretaria?: string, funcao?: string, page?: number, limit?: number, incluirFiltros?: boolean|string }} params
 */
export const buscarParaSelecao = (params = {}) =>
  apiClient
    .get("/api/funcionarios/para-selecao", {
      params: {
        ...params,
        incluirFiltros:
          params.incluirFiltros === true || params.incluirFiltros === "1"
            ? "1"
            : params.incluirFiltros === false
              ? undefined
              : params.incluirFiltros,
      },
    })
    .then((r) => r.data);

export const buscarPorSetorId = (setorId) =>
  apiClient
    .get(`/api/funcionarios/buscarFuncionariosPorSetorId/${setorId}`)
    .then((r) => r.data);

/**
 * Funcionários do nó e de todos os descendentes (subtree).
 * @returns {{ funcionarios: array, total: number, page: number, pages: number }}
 */
export const buscarPorSetorSubtree = (setorId, { page = 1, limit = 5000 } = {}) =>
  apiClient
    .get(`/api/funcionarios/setores/${setorId}/funcionarios`, {
      params: { page, limit },
    })
    .then((r) => r.data);

/** @deprecated use buscarPorSetorId */
export const buscarPorCoordenadoria = (id) => buscarPorSetorId(id);

export const buscarPorSetores = ({ ids, page = 1, limit = 1000 } = {}) =>
  apiClient
    .post("/api/funcionarios/por-setores", { ids, page, limit })
    .then((r) => r.data);

/** @deprecated use buscarPorSetores */
export const buscarPorDivisoes = (args) => buscarPorSetores(args);

export const createFuncionario = (formData) =>
  apiClient
    .post("/api/funcionarios/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const updateFuncionario = (id, formData) =>
  apiClient
    .put(`/api/funcionarios/edit-funcionario/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const deleteUsers = (userIds) =>
  apiClient
    .delete("/api/funcionarios/delete-users", {
      data: { userIds, usuariosIds: userIds },
    })
    .then((r) => r.data);

export const updateLotacao = (usuariosIds, setorId) =>
  apiClient
    .put("/api/funcionarios/editar-lotacao-usuario", {
      usuariosIds,
      setorId,
    })
    .then((r) => r.data);

/** @deprecated use updateLotacao */
export const updateCoordenadoria = (usuariosIds, coordenadoriaId) =>
  updateLotacao(usuariosIds, coordenadoriaId);

export const updateObservacoes = (userId, observacoes) =>
  apiClient
    .put(`/api/funcionarios/observacoes/${userId}`, { observacoes })
    .then((r) => r.data);

/** Payload JSON para a página de pré-visualização do relatório. */
export const buscarDadosRelatorio = (payload) =>
  apiClient
    .post("/api/funcionarios/relatorio-funcionarios/dados", payload)
    .then((r) => r.data);

export const buscarCargos = () =>
  apiClient.get("/api/funcionarios/buscarCargos").then((r) => r.data);

export const checkName = (params) =>
  apiClient.get("/api/funcionarios/check-name", { params }).then((r) => r.data);

export const hasFuncionarios = (id) =>
  apiClient.get(`/api/funcionarios/${id}/has-funcionarios`).then((r) => r.data);

export const exportCsv = (ids = []) =>
  apiClient.post(
    "/api/funcionarios/export/csv",
    { ids },
    { responseType: "blob" }
  );
