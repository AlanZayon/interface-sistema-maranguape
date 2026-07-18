import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from '@shared/api/dashboard';

export const dashboardKeys = {
  all: ["dashboard"],
  summary: () => [...dashboardKeys.all, "summary"],
};

export function useDashboardSummary(options = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: dashboardApi.getSummary,
    ...options,
  });
}
