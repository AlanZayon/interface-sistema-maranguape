import apiClient from "./client";

export const getSummary = () =>
  apiClient.get("/api/dashboard/summary").then((r) => r.data);
