import { useQuery } from "@tanstack/react-query";
import * as setoresApi from '@shared/api/setores';

export const setoresKeys = {
  all: ["setores"],
  main: () => [...setoresKeys.all, "main"],
  organized: () => [...setoresKeys.all, "organized"],
  detail: (id) => [...setoresKeys.all, "detail", id],
};

export function useMainSetores(options = {}) {
  return useQuery({
    queryKey: setoresKeys.main(),
    queryFn: setoresApi.getMainSetores,
    ...options,
  });
}

export function useSetoresOrganizados(options = {}) {
  return useQuery({
    queryKey: setoresKeys.organized(),
    queryFn: setoresApi.getSetoresOrganizados,
    ...options,
  });
}

export function useSetorData(setorId, options = {}) {
  return useQuery({
    queryKey: setoresKeys.detail(setorId),
    queryFn: () => setoresApi.getSetorData(setorId),
    enabled: Boolean(setorId),
    ...options,
  });
}
