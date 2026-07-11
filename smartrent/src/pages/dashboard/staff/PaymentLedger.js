import { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaMoneyBillWave } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, EmptyState, StatCard, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import { STAFF_NAV } from "../../../config/navigation";
import { paymentsApi } from "../../../api/payments";

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

const STATUS_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red" };

export default function PaymentLedger() {
  const [month, setMonth] = useState(currentMonth());
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentsApi
      .ledger(month)
      .then((res) => setLedger(res.data))
      .catch((err) => setError(err.message));
  }, [month]);

  return (
    <DashboardShell navItems={STAFF_NAV} title="Payment Ledger" subtitle="Browse payments collected month by month">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card">
        <button
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50"
          aria-label="Previous month"
        >
          <FaChevronLeft size={13} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-ink-900">{monthLabel(month)}</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-500 outline-none focus:border-brand-500"
          />
        </div>
        <button
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50"
          aria-label="Next month"
        >
          <FaChevronRight size={13} />
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {ledger && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <StatCard label="Total Collected" value={formatNaira(ledger.totalCollected)} icon={FaMoneyBillWave} sub={monthLabel(month)} />
            <StatCard label="Payments Recorded" value={ledger.count} />
          </div>

          {ledger.payments.length === 0 ? (
            <EmptyState icon={FaMoneyBillWave} title="No payments recorded this month" body="Switch months using the arrows above, or record a payment from a tenant's detail page." />
          ) : (
            <>
              {/* Mobile: stacked cards — a wide table can't fit a narrow screen without cutting columns off. */}
              <div className="space-y-3 sm:hidden">
                {ledger.payments.map((p) => (
                  <Card key={p.id} className="!p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-brand-600">{p.tenantName}</div>
                        <div className="text-xs text-ink-400">{p.room}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-ink-900">{formatNaira(p.amount)}</div>
                        <div className="text-xs text-ink-400">{formatDate(p.datePaid)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
                      <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                      <Badge tone={p.source === "PAYSTACK" ? "brand" : "ink"}>{p.source === "PAYSTACK" ? "Paystack" : "Manual"}</Badge>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop/tablet: full table. */}
              <div className="hidden overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card sm:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-ink-100 bg-ink-50 text-xs font-bold uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-4 py-3">Date Paid</th>
                      <th className="px-4 py-3">Tenant</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {ledger.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-ink-50/60">
                        <td className="px-4 py-3 text-ink-700">{formatDate(p.datePaid)}</td>
                        <td className="px-4 py-3 font-semibold text-brand-600">{p.tenantName}</td>
                        <td className="px-4 py-3 text-ink-700">{p.room}</td>
                        <td className="px-4 py-3 font-semibold text-ink-800">{formatNaira(p.amount)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={p.source === "PAYSTACK" ? "brand" : "ink"}>{p.source === "PAYSTACK" ? "Paystack" : "Manual"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </DashboardShell>
  );
}
