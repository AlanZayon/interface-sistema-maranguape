import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";

export const funcionariosKeys = {
  all: ["funcionarios"],
  bySetorId: (id) => [...funcionariosKeys.all, "setor", id],
  bySetorSubtree: (id) => [...funcionariosKeys.all, "setor-subtree", id],
  bySetores: (ids) => [
    ...funcionariosKeys.all,
    "setores",
    [...(ids || [])].sort().join(","),
  ],
  search: (term) => [...funcionariosKeys.all, "search", term],
  // aliases legados
  byCoordenadoria: (id) => funcionariosKeys.bySetorId(id),
  byDivisoes: (ids) => funcionariosKeys.bySetores(ids),
};

export function useFuncionariosBySetorId(setorId, options = {}) {
  return useQuery({
    queryKey: funcionariosKeys.bySetorId(setorId),
    queryFn: () => funcionariosApi.buscarPorSetorId(setorId),
    enabled: Boolean(setorId),
    ...options,
  });
}

/** Funcionários do nó + descendentes. */
export function useFuncionariosBySetorSubtree(setorId, options = {}) {
  return useQuery({
    queryKey: funcionariosKeys.bySetorSubtree(setorId),
    queryFn: async () => {
      const data = await funcionariosApi.buscarPorSetorSubtree(setorId, {
        page: 1,
        limit: 5000,
      });
      if (Array.isArray(data)) return data;
      return data?.funcionarios || [];
    },
    enabled: Boolean(setorId),
    ...options,
  });
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
