import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as dashboardApi from "@shared/api/dashboard";
import * as auditApi from "@shared/api/audit";

export const dashboardKeys = {
  all: ["dashboard"],
  summary: () => [...dashboardKeys.all, "summary"],
  contratos: (params) => [...dashboardKeys.all, "contratos", params],
  payroll: () => [...dashboardKeys.all, "payroll"],
  audit: (params) => [...dashboardKeys.all, "audit", params],
};

export function useDashboardSummary(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: dashboardApi.getSummary,
    ...options,
  });
}

export function useDashboardContratos(params = { within: 90, limit: 20 }, options = {}) {
  return useQuery({
    queryKey: dashboardKeys.contratos(params),
    queryFn: () => dashboardApi.getContratos(params),
    ...options,
  });
}

export function useDashboardPayroll(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.payroll(),
    queryFn: dashboardApi.getPayroll,
    ...options,
  });
}

export function useAuditFeed(params = { limit: 10 }, options = {}) {
  return useQuery({
    queryKey: dashboardKeys.audit(params),
    queryFn: () => auditApi.list(params),
    ...options,
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}
