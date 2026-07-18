import apiClient from "./client";

export const listCargos = () =>
  apiClient.get("/api/cargos-comissionados").then((r) => r.data);

export const createCargo = (data) =>
  apiClient.post("/api/cargos-comissionados", data).then((r) => r.data);

export const updateCargo = (id, data) =>
  apiClient.put(`/api/cargos-comissionados/${id}`, data).then((r) => r.data);

export const deleteCargo = (id) =>
  apiClient.delete(`/api/cargos-comissionados/${id}`).then((r) => r.data);

export const importCargos = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient
    .post("/api/cargos-comissionados/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const downloadTemplate = () =>
  apiClient
    .get("/api/cargos-comissionados/template", { responseType: "blob" })
    .then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "modelo-cargos-comissionados.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
