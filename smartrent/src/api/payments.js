import { api, downloadFile } from "./client";

export const paymentsApi = {
  listForTenant: (tenantId) => api.get(`/tenants/${tenantId}/payments`),
  create: (tenantId, data) => api.post(`/tenants/${tenantId}/payments`, data),
  update: (paymentId, data) => api.put(`/payments/${paymentId}`, data),
  remove: (paymentId) => api.delete(`/payments/${paymentId}`),
  auditLog: () => api.get("/payments/audit-log"),
  ledger: (month) => api.get(`/payments/ledger${month ? `?month=${month}` : ""}`),
  own: () => api.get("/tenant/payments"),
  paystackInitialize: (enableRecurring) => api.post("/tenant/payments/paystack/initialize", { enableRecurring }),
  paystackVerify: (reference) => api.post("/tenant/payments/paystack/verify", { reference }),
  downloadStatement: (tenantId, filename) => downloadFile(`/tenants/${tenantId}/payments/statement`, filename),
  downloadReceipt: (tenantId, paymentId, filename) => downloadFile(`/tenants/${tenantId}/payments/${paymentId}/receipt`, filename),
  downloadInvoice: (tenantId, filename) => downloadFile(`/tenants/${tenantId}/invoice`, filename),
};
