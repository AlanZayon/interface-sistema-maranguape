import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as referenciasApi from "@shared/api/referencias";

export const referenciasKeys = {
  all: ["referencias"],
  lista: () => [...referenciasKeys.all, "lista"],
  arvore: () => [...referenciasKeys.all, "arvore"],
  ancestrais: (id) => [...referenciasKeys.all, "ancestrais", id],
  descendentes: (id) => [...referenciasKeys.all, "descendentes", id],
  cadeiaFuncionario: (id) => [...referenciasKeys.all, "cadeia-funcionario", id],
  impacto: (id) => [...referenciasKeys.all, "impacto", id],
};

export function useReferencias(options = {}) {
  return useQuery({
    queryKey: referenciasKeys.lista(),
    queryFn: () => referenciasApi.getReferencias(),
    select: (data) => data?.referencias || [],
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/** Árvore inteira em uma única requisição — sem uma chamada por nível. */
export function useArvoreReferencias(options = {}) {
  return useQuery({
    queryKey: referenciasKeys.arvore(),
    queryFn: () => referenciasApi.getArvore(),
    select: (data) => data?.arvore || [],
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useCadeiaFuncionario(funcionarioId, options = {}) {
  return useQuery({
    queryKey: referenciasKeys.cadeiaFuncionario(funcionarioId),
    queryFn: () => referenciasApi.getCadeiaFuncionario(funcionarioId),
    enabled: Boolean(funcionarioId),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useAncestraisReferencia(referenciaId, options = {}) {
  return useQuery({
    queryKey: referenciasKeys.ancestrais(referenciaId),
    queryFn: () => referenciasApi.getAncestrais(referenciaId),
    enabled: Boolean(referenciaId),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useDescendentesReferencia(referenciaId, options = {}) {
  return useQuery({
    queryKey: referenciasKeys.descendentes(referenciaId),
    queryFn: () => referenciasApi.getDescendentes(referenciaId),
    enabled: Boolean(referenciaId),
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useImpactoExclusao(referenciaId, options = {}) {
  return useQuery({
    queryKey: referenciasKeys.impacto(referenciaId),
    queryFn: () => referenciasApi.getImpactoExclusao(referenciaId),
    enabled: Boolean(referenciaId),
    ...options,
  });
}

export function useInvalidateReferencias() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: referenciasKeys.all });
    // A exclusão realoca funcionários, então as listas também ficam obsoletas.
    queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
  };
}

export function useCriarReferencia(options = {}) {
  const invalidate = useInvalidateReferencias();
  return useMutation({
    mutationFn: (payload) => referenciasApi.createReferencia(payload),
    ...options,
    onSuccess: (...args) => {
      invalidate();
      options.onSuccess?.(...args);
    },
  });
}

export function useAtualizarReferencia(options = {}) {
  const invalidate = useInvalidateReferencias();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      referenciasApi.updateReferencia(id, payload),
    ...options,
    onSuccess: (...args) => {
      invalidate();
      options.onSuccess?.(...args);
    },
  });
}

export function useExcluirReferencia(options = {}) {
  const invalidate = useInvalidateReferencias();
  return useMutation({
    mutationFn: (id) => referenciasApi.deleteReferencia(id),
    ...options,
    onSuccess: (...args) => {
      invalidate();
      options.onSuccess?.(...args);
    },
  });
}
