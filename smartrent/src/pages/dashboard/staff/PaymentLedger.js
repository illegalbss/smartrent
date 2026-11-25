import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaMoneyBillWave } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import { STAFF_NAV } from "../../../config/navigation";
import { paymentsApi } from "../../../api/payments";
import { logPrint } from "../../../utils/printReports";

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month, delta) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("en-NG", { year: "numeric", month: "long", timeZone: "UTC" });
}

const STATUS = { PAID: { tone: "green", label: "Paid" }, PARTIAL: { tone: "amber", label: "Part-paid" }, OWING: { tone: "red", label: "Owing" } };

// Manual payments carry their method at the start of the notes
// ("Method: Cash · …", see TenantDetail). Online ones came through Paystack.
function methodOf(p) {
  if (p.source === "PAYSTACK") return "Online";
  const match = /^Method:\s*([^·]+)/.exec(p.notes || "");
  return match ? match[1].trim() : "Not recorded";
}

const METHOD_BAR = { Transfer: "bg-brand-700", Cash: "bg-gold-500", POS: "bg-[#B8AE9C]", Online: "bg-[#1F6B3A]", "Not recorded": "bg-[#E2D9C8]" };

const receiptNo = (p) => `#${p.id.slice(-8).toUpperCase()}`;
const recordedBy = (p) => (p.source === "PAYSTACK" ? "Tenant (online)" : p.createdByRole === "SECRETARY" ? "Secretary" : p.createdByRole === "LANDLORD" ? "Landlord" : "—");

function exportCsv(month, payments) {
  const header = ["Date", "Receipt", "Tenant", "Room", "Method", "Amount", "Status", "Recorded by"];
  const rows = payments.map((p) => [formatDate(p.datePaid), receiptNo(p), p.tenantName, p.room, methodOf(p), Number(p.amount), STATUS[p.status]?.label || p.status, recordedBy(p)]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `RentaFlow-payments-${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  logPrint("PAYMENTS_CSV", `${month}, ${payments.length} payments`);
}

function MethodSplit({ payments }) {
  const counts = {};
  for (const p of payments) counts[methodOf(p)] = (counts[methodOf(p)] || 0) + 1;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = payments.length;
  return (
    <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
      <div className="text-[13px] text-site-muted">By method</div>
      {total === 0 ? (
        <div className="mt-3 text-sm text-site-muted">No payments yet</div>
      ) : (
        <>
          <div
            className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-[#EEE6D8]"
            role="img"
            aria-label={entries.map(([m, n]) => `${m} ${Math.round((n / total) * 100)}%`).join(", ")}
          >
            {entries.map(([m, n]) => (
              <div key={m} className={METHOD_BAR[m] || "bg-[#B8AE9C]"} style={{ width: `${(n / total) * 100}%` }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-site-muted">
            {entries.map(([m, n]) => (
              <span key={m}>
                {m} {Math.round((n / total) * 100)}%
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function PaymentLedger() {
  const [month, setMonth] = useState(currentMonth());
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLedger(null);
    paymentsApi
      .ledger(month)
      .then((res) => setLedger(res.data))
      .catch((err) => setError(err.message));
  }, [month]);

  const owingCount = ledger?.payments.filter((p) => p.status !== "PAID").length || 0;

  return (
    <DashboardShell navItems={STAFF_NAV} title="Payments" subtitle={monthLabel(month)}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-site-border bg-white p-1">
          <button onClick={() => setMonth((m) => shiftMonth(m, -1))} className={`flex h-10 w-10 items-center justify-center rounded-lg text-brand-700 hover:bg-site-cream ${ring}`} aria-label="Previous month">
            <FaChevronLeft size={13} />
          </button>
          <label className="flex items-center">
            <span className="sr-only">Choose month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className={`min-h-[40px] rounded-lg border-0 bg-transparent px-2 text-sm font-semibold text-site-text ${ring}`}
            />
          </label>
          <button onClick={() => setMonth((m) => shiftMonth(m, 1))} className={`flex h-10 w-10 items-center justify-center rounded-lg text-brand-700 hover:bg-site-cream ${ring}`} aria-label="Next month">
            <FaChevronRight size={13} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => ledger && exportCsv(month, ledger.payments)}
            disabled={!ledger || ledger.payments.length === 0}
            className={`inline-flex min-h-[44px] items-center rounded-xl border-[1.5px] border-brand-700 bg-white px-5 font-bold text-brand-700 transition disabled:opacity-40 motion-safe:enabled:hover:-translate-y-0.5 ${ring}`}
          >
            Export CSV
          </button>
          <Link
            to="/dashboard/staff/tenants"
            className={`inline-flex min-h-[44px] items-center rounded-xl bg-gold-500 px-5 font-bold text-site-text transition motion-safe:hover:-translate-y-0.5 ${ring}`}
          >
            Record payment
          </Link>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}
      {!ledger && !error && <p className="text-sm text-site-muted">Loading payments…</p>}

      {ledger && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
            <div className="rounded-[18px] bg-brand-700 p-5 text-white">
              <div className="text-[13px] text-[#F3D9A0]">Recorded in {monthLabel(month)}</div>
              <div className="mt-1 truncate font-display text-[28px] font-bold" title={formatNaira(ledger.totalCollected)}>
                {formatNaira(ledger.totalCollected)}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
              <div className="text-[13px] text-site-muted">Payments recorded</div>
              <div className="mt-1 font-display text-[28px] font-bold">{ledger.count}</div>
              <div className="mt-1 text-[13px] text-site-muted">{owingCount} part-paid or owing</div>
            </div>
            <MethodSplit payments={ledger.payments} />
          </div>

          {ledger.payments.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={FaMoneyBillWave} title="No payments recorded this month" body="Switch months using the arrows above, or record a payment from a tenant's page." />
            </div>
          ) : (
            <>
              {/* Phones: stacked cards — a wide table can't fit a narrow screen. */}
              <ul className="m-0 mt-4 list-none space-y-3 p-0 md:hidden">
                {ledger.payments.map((p) => (
                  <li key={p.id} className="rounded-[18px] border border-[#EFE6D6] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/dashboard/staff/tenants/${p.tenantId}`} className={`font-semibold text-site-text hover:text-brand-700 ${ring}`}>
                          {p.tenantName}
                        </Link>
                        <div className="text-xs text-site-muted">{p.room}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatNaira(p.amount)}</div>
                        <div className="text-xs text-site-muted">{formatDate(p.datePaid)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F3ECDF] pt-3 text-xs text-site-muted">
                      <Badge tone={STATUS[p.status]?.tone}>{STATUS[p.status]?.label || p.status}</Badge>
                      <span>{methodOf(p)}</span>
                      <span>· {receiptNo(p)}</span>
                      <button
                        onClick={() => paymentsApi.downloadReceipt(p.tenantId, p.id, `Receipt-${p.tenantName}.pdf`)}
                        className={`ml-auto min-h-[44px] px-1 font-semibold text-brand-700 hover:underline ${ring}`}
                      >
                        Receipt
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Tablet and up: full table. */}
              <div className="mt-4 hidden overflow-x-auto rounded-[18px] border border-[#EFE6D6] bg-white px-5 pb-3 pt-1 md:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[13px] text-site-muted">
                      {["Date", "Receipt", "Tenant", "Method", "Amount", "Recorded by", "Status", ""].map((h) => (
                        <th key={h} className="border-b border-[#EEE6D8] px-2 py-3.5 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.payments.map((p) => (
                      <tr key={p.id} className="border-b border-[#F3ECDF] last:border-b-0 hover:bg-site-cream/60">
                        <td className="whitespace-nowrap px-2 py-3.5">{formatDate(p.datePaid)}</td>
                        <td className="whitespace-nowrap px-2 py-3.5 text-site-muted">{receiptNo(p)}</td>
                        <td className="px-2 py-3.5">
                          <Link to={`/dashboard/staff/tenants/${p.tenantId}`} className={`font-semibold hover:text-brand-700 hover:underline ${ring}`}>
                            {p.tenantName}
                          </Link>
                          <div className="text-xs text-site-muted">{p.room}</div>
                        </td>
                        <td className="px-2 py-3.5">{methodOf(p)}</td>
                        <td className="whitespace-nowrap px-2 py-3.5 font-semibold">{formatNaira(p.amount)}</td>
                        <td className="px-2 py-3.5">{recordedBy(p)}</td>
                        <td className="px-2 py-3.5">
                          <Badge tone={STATUS[p.status]?.tone}>{STATUS[p.status]?.label || p.status}</Badge>
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          <button
                            onClick={() => paymentsApi.downloadReceipt(p.tenantId, p.id, `Receipt-${p.tenantName}.pdf`)}
                            className={`min-h-[44px] px-1 font-semibold text-brand-700 hover:underline ${ring}`}
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="mt-4 rounded-xl bg-[#F6E7BC] px-4 py-3.5 text-[13px] leading-relaxed text-[#5A4100]">
            To correct a mistake, open the tenant's page to edit or delete the payment. Every change is kept in the payment history log.
          </p>
        </>
      )}
    </DashboardShell>
  );
}
