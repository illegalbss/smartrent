import { api, uploadFile } from "./client";

export const propertiesApi = {
  list: () => api.get("/properties"),
  get: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post("/properties", data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  remove: (id) => api.delete(`/properties/${id}`),
  uploadPhoto: (id, file) => uploadFile(`/properties/${id}/photo`, file),
  photoUrl: (id) => `/properties/${id}/photo`,
};

export const roomsApi = {
  list: (propertyId) => api.get(`/properties/${propertyId}/rooms`),
  create: (propertyId, data) => api.post(`/properties/${propertyId}/rooms`, data),
  update: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  remove: (roomId) => api.delete(`/rooms/${roomId}`),
};
