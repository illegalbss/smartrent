import { api, uploadFile } from "./client";

export const tenantsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/tenants${qs ? `?${qs}` : ""}`);
  },
  get: (id) => api.get(`/tenants/${id}`),
  register: (data) => api.post("/tenants", data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  offboard: (id) => api.post(`/tenants/${id}/offboard`, {}),
  loginLink: (id) => api.post(`/tenants/${id}/login-link`, {}),
  loginLinks: (propertyId) => api.post("/tenants/login-links", { propertyId }),
  remove: (id) => api.delete(`/tenants/${id}`),
  uploadPhoto: (id, file) => uploadFile(`/tenants/${id}/photo`, file),
  photoUrl: (id) => `/tenants/${id}/photo`,
};
