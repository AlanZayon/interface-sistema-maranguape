import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";

export const PAGE_SIZE = 50;

export const funcionariosKeys = {
  all: ["funcionarios"],
  list: (mode, filters) => [...funcionariosKeys.all, "list", mode, filters],
  bySetorId: (id, filters) => [
    ...funcionariosKeys.all,
    "setor",
    id,
    filters,
  ],
  bySetorSubtree: (id, filters) => [
    ...funcionariosKeys.all,
    "setor-subtree",
    id,
    filters,
  ],
  bySetores: (ids, filters) => [
    ...funcionariosKeys.all,
    "setores",
    [...(ids || [])].sort().join(","),
    filters,
  ],
  filtros: () => [...funcionariosKeys.all, "filtros"],
  search: (term) => [...funcionariosKeys.all, "search", term],
  byCoordenadoria: (id, filters) => funcionariosKeys.bySetorId(id, filters),
  byDivisoes: (ids, filters) => funcionariosKeys.bySetores(ids, filters),
};

function normalizeFilters(filters = {}) {
  return {
    q: filters.q || "",
    natureza: Array.isArray(filters.natureza)
      ? filters.natureza[0] || ""
      : filters.natureza || "",
    funcao: Array.isArray(filters.funcao)
      ? filters.funcao[0] || ""
      : filters.funcao || "",
    bairro: Array.isArray(filters.bairro)
      ? filters.bairro[0] || ""
      : filters.bairro || "",
    referencia: Array.isArray(filters.referencia)
      ? filters.referencia[0] || ""
      : filters.referencia || "",
    secretaria: filters.secretaria || "",
  };
}

function flattenPages(data) {
  if (!data?.pages) return [];
  return data.pages.flatMap((p) => p.funcionarios || []);
}

function getNextPageParam(lastPage) {
  if (!lastPage) return undefined;
  const page = lastPage.page || 1;
  const pages = lastPage.pages || 1;
  return page < pages ? page + 1 : undefined;
}

export function useFuncionariosFiltros(options = {}) {
  return useQuery({
    queryKey: funcionariosKeys.filtros(),
    queryFn: () => funcionariosApi.buscarFiltrosDisponiveis(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Infinite list: todos os funcionários do tenant. */
export function useInfiniteFuncionarios(filters = {}, options = {}) {
  const f = normalizeFilters(filters);
  return useInfiniteQuery({
    queryKey: funcionariosKeys.list("all", f),
    queryFn: ({ pageParam = 1 }) =>
      funcionariosApi.buscarFuncionarios({
        page: pageParam,
        limit: PAGE_SIZE,
        ...f,
      }),
    getNextPageParam,
    initialPageParam: 1,
    ...options,
  });
}

/** Infinite list: lotação exata do nó. */
export function useInfiniteFuncionariosBySetorId(
  setorId,
  filters = {},
  options = {}
) {
  const f = normalizeFilters(filters);
  return useInfiniteQuery({
    queryKey: funcionariosKeys.bySetorId(setorId, f),
    queryFn: ({ pageParam = 1 }) =>
      funcionariosApi.buscarPorSetorId(setorId, {
        page: pageParam,
        limit: PAGE_SIZE,
        ...f,
      }),
    getNextPageParam,
    initialPageParam: 1,
    enabled: Boolean(setorId),
    ...options,
  });
}

/** Infinite list: nó + descendentes. */
export function useInfiniteFuncionariosBySetorSubtree(
  setorId,
  filters = {},
  options = {}
) {
  const f = normalizeFilters(filters);
  return useInfiniteQuery({
    queryKey: funcionariosKeys.bySetorSubtree(setorId, f),
    queryFn: ({ pageParam = 1 }) =>
      funcionariosApi.buscarPorSetorSubtree(setorId, {
        page: pageParam,
        limit: PAGE_SIZE,
        ...f,
      }),
    getNextPageParam,
    initialPageParam: 1,
    enabled: Boolean(setorId),
    ...options,
  });
}

/** Infinite list: match exato em vários setores. */
export function useInfiniteFuncionariosBySetores(
  ids,
  filters = {},
  options = {}
) {
  const f = normalizeFilters(filters);
  const idList = ids || [];
  return useInfiniteQuery({
    queryKey: funcionariosKeys.bySetores(idList, f),
    queryFn: ({ pageParam = 1 }) =>
      funcionariosApi.buscarPorSetores({
        ids: idList,
        page: pageParam,
        limit: PAGE_SIZE,
        ...f,
      }),
    getNextPageParam,
    initialPageParam: 1,
    enabled: idList.length > 0,
    ...options,
  });
}

/** Compat: first page only as array (lotação panel count, etc.). */
export function useFuncionariosBySetorId(setorId, options = {}) {
  const query = useInfiniteFuncionariosBySetorId(setorId, {}, options);
  return {
    ...query,
    data: flattenPages(query.data),
    total: query.data?.pages?.[0]?.total ?? flattenPages(query.data).length,
  };
}

export function useFuncionariosBySetorSubtree(setorId, options = {}) {
  const query = useInfiniteFuncionariosBySetorSubtree(setorId, {}, options);
  return {
    ...query,
    data: flattenPages(query.data),
    total: query.data?.pages?.[0]?.total ?? flattenPages(query.data).length,
  };
}

/** @deprecated use useFuncionariosBySetorId */
export function useFuncionariosByCoordenadoria(id, options = {}) {
  return useFuncionariosBySetorId(id, options);
}

export function useInvalidateFuncionarios() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: funcionariosKeys.all });
}

export { flattenPages, normalizeFilters };
