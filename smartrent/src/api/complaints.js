import { api } from "./client";

export const complaintsApi = {
  listForStaff: (status) => api.get(`/complaints${status ? `?status=${status}` : ""}`),
  respond: (id, response) => api.put(`/complaints/${id}/respond`, { response }),
  listOwn: () => api.get("/tenant/complaints"),
  create: (message) => api.post("/tenant/complaints", { message }),
};
