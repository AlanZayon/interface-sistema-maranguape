import apiClient from "./client";

export const getSummary = () =>
  apiClient.get("/api/dashboard/summary").then((r) => r.data);

export const getContratos = (params = {}) =>
  apiClient
    .get("/api/dashboard/contratos", { params })
    .then((r) => r.data);

export const getPayroll = () =>
  apiClient.get("/api/dashboard/payroll").then((r) => r.data);
