import apiClient from "./client";

export const getBySlug = (slug) =>
  apiClient.get(`/api/tenants/by-slug/${slug}`).then((r) => r.data);

export const getMe = () =>
  apiClient.get("/api/tenants/me").then((r) => r.data);

export const getBrandingPolicy = () =>
  apiClient.get("/api/tenants/branding-policy").then((r) => r.data);

export const list = () =>
  apiClient.get("/api/tenants").then((r) => r.data?.tenants || r.data || []);

export const getById = (id) =>
  apiClient.get(`/api/tenants/${id}`).then((r) => r.data);

export const create = (payload) =>
  apiClient.post("/api/tenants", payload).then((r) => r.data);

export const update = (id, payload) =>
  apiClient.patch(`/api/tenants/${id}`, payload).then((r) => r.data);

export const updateMe = (payload) =>
  apiClient.patch("/api/tenants/me", payload).then((r) => r.data);

export const deactivate = (id) =>
  apiClient.delete(`/api/tenants/${id}`).then((r) => r.data);

export const uploadAsset = (id, file, kind = "logo") => {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  return apiClient
    .post(`/api/tenants/${id}/assets?kind=${kind}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};
