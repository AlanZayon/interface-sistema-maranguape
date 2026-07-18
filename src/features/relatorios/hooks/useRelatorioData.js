import { useQuery } from "@tanstack/react-query";
import * as funcionariosApi from "@shared/api/funcionarios";

export const relatorioKeys = {
  all: ["relatorio"],
  dados: (ids, tipo) => ["relatorio", "dados", tipo, ...(ids || [])],
};

export function useRelatorioData(ids, tipo, enabled = true) {
  return useQuery({
    queryKey: relatorioKeys.dados(ids, tipo),
    queryFn: () => funcionariosApi.buscarDadosRelatorio({ ids, tipo }),
    enabled: Boolean(enabled && ids?.length && tipo),
    staleTime: 60_000,
  });
}
