import { api } from "./client";

export const paymentsApi = {
  listForTenant: (tenantId) => api.get(`/tenants/${tenantId}/payments`),
  create: (tenantId, data) => api.post(`/tenants/${tenantId}/payments`, data),
  update: (paymentId, data) => api.put(`/payments/${paymentId}`, data),
  remove: (paymentId) => api.delete(`/payments/${paymentId}`),
  auditLog: () => api.get("/payments/audit-log"),
  own: () => api.get("/tenant/payments"),
  paystackInitialize: () => api.post("/tenant/payments/paystack/initialize", {}),
  paystackVerify: (reference) => api.post("/tenant/payments/paystack/verify", { reference }),
};
