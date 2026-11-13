import { useEffect, useMemo, useState } from "react";
import ConfirmPaymentSheet from "../payments/ConfirmPaymentSheet";
import { showPaymentSuccess } from "../../utils/paymentSuccess";
import { tenantsApi } from "../../api/tenants";
import { paymentsApi } from "../../api/payments";
import { dashboardApi } from "../../api/dashboard";
import { formatDate, formatNaira } from "./UiKit";

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";
const METHODS = ["Transfer", "Cash", "POS"];
const STATUSES = [
  { value: "PAID", label: "Paid in full" },
  { value: "PARTIAL", label: "Part payment" },
];
const today = () => new Date().toISOString().slice(0, 10);

function unitOf(t) {
  return t.room ? `${t.room.propertyName} · ${t.room.roomNumber}` : "No unit";
}

function periodLabel(p) {
  if (p.coverageStart && p.coverageEnd) return `${formatDate(p.coverageStart)} – ${formatDate(p.coverageEnd)}`;
  return `Paid ${formatDate(p.datePaid)}`;
}

function downloadCsv(filename, header, rows) {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Secretary/accountant home: record a payment in one place, see today's
// payments, download the two reports they ask for most. Same confirm sheet
// and success screen as the tenant page — nothing is saved until "Confirm and save".
export default function QuickRecordPayment() {
  const [tenants, setTenants] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [form, setForm] = useState({ tenantId: "", amount: "", datePaid: today(), method: "Transfer", status: "PAID", notes: "" });
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [reportError, setReportError] = useState("");

  function loadLedger() {
    paymentsApi
      .ledger()
      .then((res) => setLedger(res.data))
      .catch(() => setLedger({ payments: [] }));
  }

  useEffect(() => {
    tenantsApi
      .list({ limit: 500 })
      .then((res) => setTenants(res.data.filter((t) => t.room).sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
    loadLedger();
  }, []);

  const tenant = tenants.find((t) => t.id === form.tenantId) || null;
  const paidToday = useMemo(() => (ledger?.payments || []).filter((p) => p.datePaid?.slice(0, 10) === today()), [ledger]);
  const paidTodayTotal = paidToday.reduce((sum, p) => sum + Number(p.amount), 0);

  function review(e) {
    e.preventDefault();
    if (!tenant) return setFormError("Choose the tenant who paid.");
    if (!(Number(form.amount) > 0)) return setFormError("Enter the amount received.");
    if (!form.datePaid) return setFormError("Enter the date it was paid.");
    setFormError("");
    setSaveError("");
    setConfirming(true);
  }

  async function confirm() {
    setSaving(true);
    setSaveError("");
    let saved;
    try {
      const notes = [`Method: ${form.method}`, form.notes.trim()].filter(Boolean).join(" · ");
      const res = await paymentsApi.create(tenant.id, { amount: Number(form.amount), datePaid: form.datePaid, status: form.status, notes });
      saved = res.data;
    } catch (err) {
      setSaveError(err.message); // keep the sheet open with Retry
      return;
    } finally {
      setSaving(false);
    }
    setConfirming(false);
    setForm((f) => ({ ...f, tenantId: "", amount: "", notes: "" }));
    loadLedger();
    await new Promise((r) => setTimeout(r, 0));
    showPaymentSuccess({
      tenant: tenant.name,
      unit: unitOf(tenant),
      amount: saved.amount,
      period: periodLabel(saved),
      receiptNo: `#${saved.id.slice(-8).toUpperCase()}`,
      status: saved.status,
      phone: tenant.phone,
    });
  }

  function downloadMonthly() {
    const payments = ledger?.payments || [];
    downloadCsv(
      `RentaFlow-income-${ledger?.month || "this-month"}.csv`,
      ["Date", "Receipt", "Tenant", "Room", "Amount", "Status"],
      payments.map((p) => [formatDate(p.datePaid), `#${p.id.slice(-8).toUpperCase()}`, p.tenantName, p.room, Number(p.amount), p.status])
    );
  }

  async function downloadArrears() {
    setReportError("");
    try {
      const { data } = await dashboardApi.get();
      downloadCsv(
        `RentaFlow-arrears-${today()}.csv`,
        ["Tenant", "Room", "Last payment status", "Last payment date"],
        data.finance.tenantsInArrears.map((t) => [t.name, t.room, t.lastPaymentStatus, t.lastPaymentDate ? formatDate(t.lastPaymentDate) : "None"])
      );
    } catch (err) {
      setReportError(err.message);
    }
  }

  const label = "text-sm font-semibold";
  const field = `mt-1.5 min-h-[48px] w-full rounded-xl border-[1.5px] border-[#D9CFBD] bg-white px-3.5 text-base text-site-text outline-none focus:border-brand-700 focus:ring-[3px] focus:ring-[#F0D58A]`;
  const pill = (active) =>
    `min-h-[44px] rounded-full px-[18px] text-sm font-semibold transition ${ring} ${
      active ? "bg-brand-700 text-white" : "border-[1.5px] border-[#D9CFBD] bg-white text-site-text hover:border-brand-300"
    }`;

  return (
    <section aria-labelledby="quick-record-title" className="mb-8">
      <h2 id="quick-record-title" className="m-0 font-display text-[28px] font-bold">
        Record a payment
      </h2>
      <p className="m-0 mt-1.5 max-w-xl leading-relaxed text-site-muted">
        Enter money you have already received. You can edit or delete it later, and every change stays in the history log.
      </p>

      <div className="mt-5 flex flex-wrap items-start gap-5">
        <form onSubmit={review} className="min-w-0 flex-[1_1_380px] rounded-[18px] border border-[#EFE6D6] bg-white p-6" noValidate>
          <label className={`block ${label}`}>
            Tenant
            <select value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))} className={field}>
              <option value="">Choose who paid…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {unitOf(t)}
                </option>
              ))}
            </select>
          </label>
          {tenant && Number(tenant.outstanding) > 0 && (
            <p className="m-0 mt-1.5 text-[13px] text-site-muted">Balance due: {formatNaira(tenant.outstanding)}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4">
            <label className={`min-w-[150px] flex-1 ${label}`}>
              Amount (₦)
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="150000"
                className={field}
              />
            </label>
            <label className={`min-w-[150px] flex-1 ${label}`}>
              Date paid
              <input type="date" value={form.datePaid} onChange={(e) => setForm((f) => ({ ...f, datePaid: e.target.value }))} className={field} />
            </label>
          </div>

          <fieldset className="m-0 mt-4 border-0 p-0">
            <legend className={label}>Method</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button type="button" key={m} aria-pressed={form.method === m} onClick={() => setForm((f) => ({ ...f, method: m }))} className={pill(form.method === m)}>
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="m-0 mt-4 border-0 p-0">
            <legend className={label}>Is this the full rent?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button type="button" key={s.value} aria-pressed={form.status === s.value} onClick={() => setForm((f) => ({ ...f, status: s.value }))} className={pill(form.status === s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={`mt-4 block ${label}`}>
            Notes (optional)
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. paid by brother" className={field} />
          </label>

          {formError && (
            <p role="alert" className="m-0 mt-3 text-sm font-medium text-[#8A1C1C]">
              {formError}
            </p>
          )}

          <button type="submit" className={`mt-5 flex min-h-[52px] w-full items-center justify-center rounded-[14px] bg-brand-700 font-bold text-white transition motion-safe:hover:-translate-y-0.5 ${ring}`}>
            Review and confirm
          </button>
        </form>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
            <h3 className="m-0 font-display text-xl font-bold">Paid today</h3>
            <div className="mt-3 font-display text-[30px] font-bold">{formatNaira(paidTodayTotal)}</div>
            <div className="text-[13px] text-site-muted">
              {paidToday.length} payment{paidToday.length === 1 ? "" : "s"}
            </div>
            {paidToday.length > 0 && (
              <ul className="m-0 mt-3 list-none p-0">
                {paidToday.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 border-t border-[#F3ECDF] py-2.5 text-sm">
                    <span className="min-w-0 truncate">
                      {p.tenantName} · {p.room}
                    </span>
                    <b className="whitespace-nowrap">{formatNaira(p.amount)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
            <h3 className="m-0 font-display text-xl font-bold">Reports</h3>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {[
                ["Income this month", downloadMonthly],
                ["Arrears list", downloadArrears],
              ].map(([name, fn]) => (
                <button
                  key={name}
                  type="button"
                  onClick={fn}
                  className={`flex min-h-[44px] items-center justify-between rounded-xl border-[1.5px] border-site-border px-3.5 text-left text-sm font-semibold hover:bg-site-cream ${ring}`}
                >
                  {name} <span className="text-brand-700">Download</span>
                </button>
              ))}
            </div>
            {reportError && <p className="m-0 mt-2 text-sm text-[#8A1C1C]">{reportError}</p>}
          </div>
        </div>
      </div>

      {confirming && tenant && (
        <ConfirmPaymentSheet
          details={{
            tenant: tenant.name,
            unit: unitOf(tenant),
            period: "Worked out from the date paid",
            method: form.method,
            status: form.status === "PAID" ? "Paid" : "Part-paid",
            amount: formatNaira(Number(form.amount)),
          }}
          saving={saving}
          error={saveError}
          onConfirm={confirm}
          onBack={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
