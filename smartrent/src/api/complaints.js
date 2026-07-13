import { api } from "./client";

export const complaintsApi = {
  // Accepts either a bare status string (legacy call sites) or a params object like { status, tenantId }.
  listForStaff: (params = {}) => {
    const query = typeof params === "string" ? (params ? { status: params } : {}) : params;
    const qs = new URLSearchParams(query).toString();
    return api.get(`/complaints${qs ? `?${qs}` : ""}`);
  },
  createForTenant: (tenantId, data) => api.post(`/tenants/${tenantId}/complaints`, data),
  updateTriage: (id, data) => api.put(`/complaints/${id}`, data),
  respond: (id, response) => api.put(`/complaints/${id}/respond`, { response }),
  listOwn: () => api.get("/tenant/complaints"),
  create: (message) => api.post("/tenant/complaints", { message }),
};
