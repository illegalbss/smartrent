import { api } from "./client";

export const maintenanceApi = {
  listForStaff: (status) => api.get(`/maintenance${status ? `?status=${status}` : ""}`),
  updateStatus: (id, status) => api.put(`/maintenance/${id}`, { status }),
  listOwn: () => api.get("/tenant/maintenance"),
  create: (data) => api.post("/tenant/maintenance", data),
};
