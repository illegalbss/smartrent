import { Link } from "react-router-dom";
import { FaMoneyBillWave, FaCalendarCheck, FaExclamationTriangle } from "react-icons/fa";
import { Card, StatCard, Badge, formatDate, formatNaira } from "./UiKit";

const STATUS_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red", NO_PAYMENTS: "ink" };
const STATUS_LABEL = { PAID: "Paid", PARTIAL: "Partial", OWING: "Owing", NO_PAYMENTS: "No payments yet" };

export default function FinanceReportSection({ finance, title = "Finance Report" }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-ink-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Collected"
          value={formatNaira(finance.totalCollected)}
          icon={FaMoneyBillWave}
          sub={`Manual ${formatNaira(finance.bySource.MANUAL.total)} · Paystack ${formatNaira(finance.bySource.PAYSTACK.total)}`}
        />
        <StatCard label="Collected This Month" value={formatNaira(finance.collectedThisMonth)} icon={FaCalendarCheck} />
        <StatCard
          label="Outstanding (Owing)"
          value={formatNaira(finance.totalOwing)}
          icon={FaExclamationTriangle}
          sub={`${finance.byStatus.OWING.count} payment(s) marked owing`}
        />
      </div>

      <Card title="Tenants in Arrears" className="mt-4">
        {finance.tenantsInArrears.length === 0 ? (
          <p className="text-sm text-ink-400">No tenants currently owing or unpaid — every occupied room is up to date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-ink-100 text-xs font-bold uppercase text-ink-400">
                <tr>
                  <th className="py-2 pr-4">Tenant</th>
                  <th className="py-2 pr-4">Room</th>
                  <th className="py-2 pr-4">Last Payment</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {finance.tenantsInArrears.map((t) => (
                  <tr key={t.tenantId}>
                    <td className="py-2.5 pr-4">
                      <Link to={`/dashboard/staff/tenants/${t.tenantId}`} className="font-semibold text-brand-600 hover:text-brand-700">
                        {t.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-700">{t.room || "—"}</td>
                    <td className="py-2.5 pr-4 text-ink-700">{formatDate(t.lastPaymentDate)}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={STATUS_TONE[t.lastPaymentStatus]}>{STATUS_LABEL[t.lastPaymentStatus]}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
