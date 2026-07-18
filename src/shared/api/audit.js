import apiClient from "./client";

export const list = (params = {}) =>
  apiClient.get("/api/audit", { params }).then((r) => r.data);
