import { api, uploadFile, downloadFile } from "./client";

export const documentsApi = {
  listForTenant: (tenantId) => api.get(`/tenants/${tenantId}/documents`),
  uploadForTenant: (tenantId, file, type) => uploadFile(`/tenants/${tenantId}/documents`, file, { type }),
  download: (documentId, filename) => downloadFile(`/documents/${documentId}/download`, filename),
  remove: (documentId) => api.delete(`/documents/${documentId}`),
  generateAgreement: (tenantId) => api.post(`/tenants/${tenantId}/documents/tenancy-agreement/generate`, {}),
};
