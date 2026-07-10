import { api } from "./client";

export const secretariesApi = {
  list: () => api.get("/secretaries"),
  invite: (data) => api.post("/secretaries/invite", data),
  remove: (id) => api.delete(`/secretaries/${id}`),
};
