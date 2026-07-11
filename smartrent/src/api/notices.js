import { api } from "./client";

export const noticesApi = {
  listForStaff: () => api.get("/notices"),
  create: (data) => api.post("/notices", data),
  remove: (id) => api.delete(`/notices/${id}`),
  listOwn: () => api.get("/tenant/notices"),
};
