import { api } from "./client";

export const superAdminApi = {
  stats: () => api.get("/superadmin/stats"),
  storageUsage: () => api.get("/superadmin/storage-usage"),
  revenue: () => api.get("/superadmin/revenue"),
  transactions: () => api.get("/superadmin/transactions"),

  listLandlords: () => api.get("/superadmin/landlords"),
  getLandlord: (id) => api.get(`/superadmin/landlords/${id}`),
  createLandlord: (data) => api.post("/superadmin/landlords", data),
  updateLandlord: (id, data) => api.put(`/superadmin/landlords/${id}`, data),
  deactivateLandlord: (id) => api.post(`/superadmin/landlords/${id}/deactivate`, {}),
  reactivateLandlord: (id) => api.post(`/superadmin/landlords/${id}/reactivate`, {}),
  deleteLandlord: (id) => api.delete(`/superadmin/landlords/${id}`),

  listPlans: () => api.get("/superadmin/plans"),
  createPlan: (data) => api.post("/superadmin/plans", data),
  updatePlan: (id, data) => api.put(`/superadmin/plans/${id}`, data),

  activityLogs: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return api.get(`/superadmin/activity-logs${qs ? `?${qs}` : ""}`);
  },
};

export const plansApi = {
  list: () => api.get("/plans"),
};
