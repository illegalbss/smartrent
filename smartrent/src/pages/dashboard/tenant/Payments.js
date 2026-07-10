import { useEffect, useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import { TENANT_NAV } from "../../../config/navigation";
import { paymentsApi } from "../../../api/payments";

export default function TenantPayments() {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    paymentsApi
      .own()
      .then((res) => setPayments(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <DashboardShell navItems={TENANT_NAV} title="Payment History" subtitle="Your recorded rent payments">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {payments && payments.length === 0 && (
        <EmptyState icon={FaMoneyBillWave} title="No payments recorded yet" body="Payments recorded by your landlord or secretary will appear here." />
      )}

      {payments && payments.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-bold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Date Paid</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Coverage Period</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{formatDate(p.datePaid)}</td>
                  <td className="px-4 py-3 font-semibold text-ink-800">{formatNaira(p.amount)}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {p.coverageStart ? `${formatDate(p.coverageStart)} – ${formatDate(p.coverageEnd)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === "PAID" ? "green" : p.status === "PARTIAL" ? "amber" : "red"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.source === "PAYSTACK" ? "brand" : "ink"}>{p.source === "PAYSTACK" ? "Paystack" : "Manual"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
