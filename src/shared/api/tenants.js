import apiClient from "./client";

export const getBySlug = (slug) =>
  apiClient.get(`/api/tenants/by-slug/${slug}`).then((r) => r.data);

export const getMe = () =>
  apiClient.get("/api/tenants/me").then((r) => r.data);
