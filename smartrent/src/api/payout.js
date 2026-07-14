import { api } from "./client";

export const payoutApi = {
  status: () => api.get("/landlord/payout"),
  banks: () => api.get("/landlord/payout/banks"),
  resolveAccount: (accountNumber, bankCode) =>
    api.get(`/landlord/payout/resolve-account?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`),
  setup: (data) => api.post("/landlord/payout", data),
};
