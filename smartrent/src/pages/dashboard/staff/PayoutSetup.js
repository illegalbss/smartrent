import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaWallet } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge } from "../../../components/dashboard/UiKit";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { payoutApi } from "../../../api/payout";

const ACCOUNT_TYPES = [
  { value: "INDIVIDUAL", label: "Individual", nameLabel: "Full Name" },
  { value: "ORGANIZATION", label: "Organization", nameLabel: "Organization Name" },
];

export default function PayoutSetup() {
  const [status, setStatus] = useState(null);
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ accountType: "INDIVIDUAL", businessName: "", bankCode: "", accountNumber: "", rcNumber: "" });
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function load() {
    payoutApi
      .status()
      .then((res) => {
        setStatus(res.data);
        if (res.data.accountType) {
          setForm({
            accountType: res.data.accountType,
            businessName: res.data.payoutBusinessName || "",
            bankCode: res.data.payoutBankCode || "",
            accountNumber: res.data.payoutAccountNumber || "",
            rcNumber: res.data.payoutRcNumber || "",
          });
        }
      })
      .catch((err) => setError(err.message));
    payoutApi.banks().then((res) => setBanks(res.data)).catch(() => {});
  }
  useEffect(load, []);

  useEffect(() => {
    setResolvedName("");
    setResolveError("");
    if (form.accountNumber.length !== 10 || !form.bankCode) return;
    setResolving(true);
    const t = setTimeout(() => {
      payoutApi
        .resolveAccount(form.accountNumber, form.bankCode)
        .then((res) => setResolvedName(res.data.accountName))
        .catch((err) => setResolveError(err.message))
        .finally(() => setResolving(false));
    }, 500);
    return () => clearTimeout(t);
  }, [form.accountNumber, form.bankCode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setSuccessMsg("");
    try {
      await payoutApi.setup(form);
      setSuccessMsg("Payout details saved — online rent collection is now active for this account.");
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = ACCOUNT_TYPES.find((t) => t.value === form.accountType);

  return (
    <DashboardShell navItems={STAFF_NAV} title="Payout Setup" subtitle="How you get paid for rent collected online through RentaFlow">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {status && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-5 shadow-card">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${status.payoutVerified ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
            {status.payoutVerified ? <FaCheckCircle size={18} /> : <FaExclamationTriangle size={18} />}
          </span>
          <div>
            <div className="text-sm font-bold text-ink-900">
              {status.payoutVerified ? "Payouts Verified" : "Setup Required"}
            </div>
            <p className="text-xs text-ink-500">
              {status.payoutVerified
                ? "Tenants and shop owners can pay their rent online — funds route directly to your bank account."
                : "Online rent collection is blocked until this is completed. Manual payment recording still works normally."}
            </p>
          </div>
          {status.payoutVerified && <Badge tone="green">✅ Verified</Badge>}
        </div>
      )}

      <Card title="Payout Details">
        <p className="mb-4 text-xs text-ink-500">
          100% of rent collected online is routed directly to the account below — RentaFlow takes no cut of your
          rent payments.
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Account Type</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, accountType: t.value }))}
                className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                  form.accountType === t.value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:border-brand-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <FormField
            label={selectedType.nameLabel}
            name="businessName"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            required
          />

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Bank</label>
            <select
              value={form.bankCode}
              onChange={(e) => setForm((f) => ({ ...f, bankCode: e.target.value }))}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white"
              required
            >
              <option value="">Select your bank</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <FormField
            label="Account Number"
            name="accountNumber"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            required
          />
          {resolving && <p className="-mt-3 mb-4 text-xs text-ink-400">Verifying account…</p>}
          {resolvedName && (
            <p className="-mt-3 mb-4 text-xs font-semibold text-green-600">Account name: {resolvedName}</p>
          )}
          {resolveError && <p className="-mt-3 mb-4 text-xs font-medium text-red-500">{resolveError}</p>}

          {form.accountType === "ORGANIZATION" && (
            <FormField
              label="RC/CAC Number (optional)"
              name="rcNumber"
              value={form.rcNumber}
              onChange={(e) => setForm((f) => ({ ...f, rcNumber: e.target.value }))}
            />
          )}

          {formError && <p className="mb-4 text-sm font-medium text-red-500">{formError}</p>}
          {successMsg && <p className="mb-4 text-sm font-medium text-green-600">{successMsg}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
          >
            <FaWallet size={13} /> {submitting ? "Saving…" : status?.payoutVerified ? "Update Payout Details" : "Activate Online Rent Collection"}
          </button>
        </form>
      </Card>
    </DashboardShell>
  );
}
