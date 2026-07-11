import { api } from "./client";

export const houseRulesApi = {
  listForStaff: () => api.get("/house-rules"),
  upsert: (data) => api.put("/house-rules", data),
  remove: (id) => api.delete(`/house-rules/${id}`),
  getOwn: () => api.get("/tenant/house-rules"),
};
