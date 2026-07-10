import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaHome,
  FaUsers,
  FaCommentDots,
  FaArrowRight,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, StatCard, Badge, EmptyState, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import { STAFF_NAV } from "../../../config/navigation";
import { dashboardApi } from "../../../api/dashboard";
import { useAuth } from "../../../context/AuthContext";

const STATUS_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red", NO_PAYMENTS: "ink" };
const STATUS_LABEL = { PAID: "Paid", PARTIAL: "Partial", OWING: "Owing", NO_PAYMENTS: "No payments yet" };

function OwnershipCard({ title, bucket }) {
  return (
    <Card title={title}>
      <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        <div>
          <div className="text-xl font-extrabold text-ink-900">{bucket.totalProperties}</div>
          <div className="text-xs text-ink-400">Properties</div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-ink-900">{bucket.totalRooms}</div>
          <div className="text-xs text-ink-400">Rooms</div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-green-600">{bucket.occupiedRooms}</div>
          <div className="text-xs text-ink-400">Occupied</div>
        </div>
        <div>
          <div className="text-xl font-extrabold text-amber-600">{bucket.vacantRooms}</div>
          <div className="text-xs text-ink-400">Vacant</div>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-500">
          <span>Occupancy Rate</span>
          <span>{bucket.occupancyRate}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${bucket.occupancyRate}%` }} />
        </div>
      </div>
    </Card>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .get()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title={`Welcome, ${user.fullName?.split(" ")[0]}`}
      subtitle="Occupancy across your portfolio, grouped by ownership type"
    >
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {!data && !error && <EmptyState title="Loading dashboard…" />}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Properties" value={data.overall.totalProperties} icon={FaBuilding} />
            <StatCard label="Total Rooms" value={data.overall.totalRooms} icon={FaHome} />
            <StatCard label="Total Tenants" value={data.totalTenants} icon={FaUsers} />
            <StatCard label="Open Complaints" value={data.openComplaints} icon={FaCommentDots} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OwnershipCard title="Organization-Owned" bucket={data.byOwnership.organization} />
            <OwnershipCard title="Personally-Owned" bucket={data.byOwnership.personal} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-ink-900">Finance Report</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Total Collected"
                value={formatNaira(data.finance.totalCollected)}
                icon={FaMoneyBillWave}
                sub={`Manual ${formatNaira(data.finance.bySource.MANUAL.total)} · Paystack ${formatNaira(data.finance.bySource.PAYSTACK.total)}`}
              />
              <StatCard label="Collected This Month" value={formatNaira(data.finance.collectedThisMonth)} icon={FaCalendarCheck} />
              <StatCard label="Outstanding (Owing)" value={formatNaira(data.finance.totalOwing)} icon={FaExclamationTriangle} sub={`${data.finance.byStatus.OWING.count} payment(s) marked owing`} />
            </div>

            <Card title="Tenants in Arrears" className="mt-4">
              {data.finance.tenantsInArrears.length === 0 ? (
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
                      {data.finance.tenantsInArrears.map((t) => (
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

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/staff/properties"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
            >
              Manage Properties <FaArrowRight size={12} />
            </Link>
            <Link
              to="/dashboard/staff/tenants"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
            >
              Manage Tenants <FaArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
