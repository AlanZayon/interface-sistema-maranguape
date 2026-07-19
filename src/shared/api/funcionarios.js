import apiClient from "./client";

const DEFAULT_PAGE_SIZE = 50;

export const buscarFuncionarios = (params = {}) =>
  apiClient
    .get("/api/funcionarios/buscarFuncionarios", {
      params: { limit: DEFAULT_PAGE_SIZE, ...params },
    })
    .then((r) => r.data);

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

export const buscarFiltrosDisponiveis = () =>
  apiClient.get("/api/funcionarios/filtros-disponiveis").then((r) => r.data);

export const buscarMidia = (id) =>
  apiClient.get(`/api/funcionarios/${id}/midia`).then((r) => r.data);

export const buscarIds = (body = {}) =>
  apiClient.post("/api/funcionarios/ids", body).then((r) => r.data);

/**
 * Lotação exata do nó (paginado).
 * @returns {{ funcionarios: array, total: number, page: number, pages: number }}
 */
export const buscarPorSetorId = (setorId, params = {}) =>
  apiClient
    .get(`/api/funcionarios/buscarFuncionariosPorSetorId/${setorId}`, {
      params: { limit: DEFAULT_PAGE_SIZE, ...params },
    })
    .then((r) => r.data);

/**
 * Funcionários do nó e de todos os descendentes (subtree).
 * @returns {{ funcionarios: array, total: number, page: number, pages: number }}
 */
export const buscarPorSetorSubtree = (setorId, params = {}) =>
  apiClient
    .get(`/api/funcionarios/setores/${setorId}/funcionarios`, {
      params: { page: 1, limit: DEFAULT_PAGE_SIZE, ...params },
    })
    .then((r) => r.data);

/** @deprecated use buscarPorSetorId */
export const buscarPorCoordenadoria = (id, params) =>
  buscarPorSetorId(id, params);

export const buscarPorSetores = ({
  ids,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  ...filters
} = {}) =>
  apiClient
    .post("/api/funcionarios/por-setores", { ids, page, limit, ...filters })
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

export const deleteUsers = async (userIds) => {
  const data = await apiClient
    .delete("/api/funcionarios/delete-users", {
      data: { userIds, usuariosIds: userIds },
    })
    .then((r) => r.data);

  if (data?.status === "queued" && data.jobId) {
    return pollJobUntilDone(data.jobId);
  }
  return data;
};

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

export const getJobStatus = (jobId) =>
  apiClient.get(`/api/funcionarios/jobs/${jobId}`).then((r) => r.data);

async function pollJobUntilDone(jobId, { intervalMs = 1000, timeoutMs = 180000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getJobStatus(jobId);
    if (status.status === "completed") {
      return status.result ?? status;
    }
    if (status.status === "failed") {
      throw new Error(status.error || "Operação em lote falhou");
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Tempo esgotado aguardando operação em lote");
}

export const exportCsv = async (ids = []) => {
  const response = await apiClient.post(
    "/api/funcionarios/export/csv",
    { ids },
    {
      responseType: "text",
      transformResponse: [(data) => data],
      validateStatus: (status) => status === 200 || status === 202,
    }
  );

  if (response.status === 202) {
    const payload =
      typeof response.data === "string"
        ? JSON.parse(response.data)
        : response.data;
    const result = await pollJobUntilDone(payload.jobId);
    const csv = typeof result === "string" ? result : result?.csv || "";
    return { data: new Blob([csv], { type: "text/csv;charset=utf-8;" }) };
  }

  return {
    data: new Blob([response.data], { type: "text/csv;charset=utf-8;" }),
  };
};

export { DEFAULT_PAGE_SIZE };
