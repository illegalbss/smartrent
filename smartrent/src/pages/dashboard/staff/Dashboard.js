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
  FaDoorOpen,
} from "react-icons/fa";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, StatCard, Badge, EmptyState, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { dashboardApi } from "../../../api/dashboard";
import { propertiesApi } from "../../../api/properties";
import { useAuth } from "../../../context/AuthContext";

const STATUS_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red", NO_PAYMENTS: "ink" };
const STATUS_LABEL = { PAID: "Paid", PARTIAL: "Partial", OWING: "Owing", NO_PAYMENTS: "No payments yet" };
const PIE_COLORS = { PAID: "#26b568", PARTIAL: "#d97706", OWING: "#dc2626" };

const OWNERSHIP_FILTERS = [
  { value: "ALL", label: "Both" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "PERSONAL", label: "Personal" },
];

function IncomeOverviewChart({ series }) {
  return (
    <Card title="Income Overview" className="lg:col-span-2">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#26b568" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#26b568" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8792a2" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#8792a2" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`)}
              width={50}
            />
            <Tooltip formatter={(value) => formatNaira(value)} labelStyle={{ color: "#1f2329" }} />
            <Area type="monotone" dataKey="total" stroke="#26b568" strokeWidth={2.5} fill="url(#incomeFill)" name="Collected" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function PaymentStatusChart({ byStatus }) {
  const segments = ["PAID", "PARTIAL", "OWING"].map((key) => ({ key, count: byStatus[key].count }));
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card title="Payment Status">
      {total === 0 ? (
        <p className="text-sm text-ink-400">No payments recorded yet.</p>
      ) : (
        <>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segments} dataKey="count" nameKey="key" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {segments.map((s) => (
                    <Cell key={s.key} fill={PIE_COLORS[s.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, STATUS_LABEL[name]]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[s.key] }} />
                  {STATUS_LABEL[s.key]}
                </span>
                <span className="font-semibold text-ink-800">
                  {s.count} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function PropertyThumb({ property }) {
  const icon = (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
      <FaBuilding size={18} />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return (
    <div className="h-12 w-12 overflow-hidden rounded-xl bg-brand-50">
      <AuthImage src={propertiesApi.photoUrl(property.id)} alt={property.name} className="h-full w-full object-cover" fallback={icon} />
    </div>
  );
}

// Each property gets its own card — deliberately not combined with any other
// property, so occupancy/tenant counts are never ambiguous about which
// building they belong to.
function PropertyOverviewCard({ property }) {
  return (
    <Link
      to={`/dashboard/staff/properties/${property.id}`}
      className="block rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PropertyThumb property={property} />
          <div>
            <h3 className="text-sm font-bold text-ink-900">{property.name}</h3>
            <p className="text-xs text-ink-400">{property.address}</p>
          </div>
        </div>
        <Badge tone={property.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
          {property.ownershipType === "ORGANIZATION" ? "Organization" : "Personal"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-ink-50 py-2">
          <div className="text-base font-extrabold text-ink-900">{property.totalRooms}</div>
          <div className="text-[10px] font-semibold uppercase text-ink-400">Rooms</div>
        </div>
        <div className="rounded-lg bg-ink-50 py-2">
          <div className="text-base font-extrabold text-green-600">{property.occupiedRooms}</div>
          <div className="text-[10px] font-semibold uppercase text-ink-400">Occupied</div>
        </div>
        <div className="rounded-lg bg-ink-50 py-2">
          <div className="text-base font-extrabold text-ink-900">{property.tenantCount}</div>
          <div className="text-[10px] font-semibold uppercase text-ink-400">Tenants</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-500">
          <span>Occupancy</span>
          <span>{property.occupancyRate}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${property.occupancyRate}%` }} />
        </div>
      </div>
    </Link>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState(null);
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([dashboardApi.get(), propertiesApi.list()])
      .then(([dashRes, propsRes]) => {
        setData(dashRes.data);
        setProperties(propsRes.data);
      })
      .catch((err) => setError(err.message));
  }, []);

  const filteredProperties = properties?.filter((p) => ownershipFilter === "ALL" || p.ownershipType === ownershipFilter) || [];

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title={`Welcome, ${user.fullName?.split(" ")[0]}`}
      subtitle="Each property tracked on its own — nothing combined"
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <IncomeOverviewChart series={data.finance.monthlySeries} />
            <PaymentStatusChart byStatus={data.finance.byStatus} />
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-ink-900">Your Properties</h2>
              <div className="flex rounded-xl border border-ink-200 p-1">
                {OWNERSHIP_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setOwnershipFilter(f.value)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                      ownershipFilter === f.value ? "bg-brand-500 text-white" : "text-ink-500 hover:text-ink-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <EmptyState
                icon={FaDoorOpen}
                title="No properties in this filter"
                body={ownershipFilter === "ALL" ? "Add a property to get started." : "Try a different filter, or add a property of this ownership type."}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((p) => (
                  <PropertyOverviewCard key={p.id} property={p} />
                ))}
              </div>
            )}
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
