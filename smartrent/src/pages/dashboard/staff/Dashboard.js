import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaHome,
  FaUsers,
  FaCommentDots,
  FaArrowRight,
  FaDoorOpen,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { StatCard, Badge, EmptyState } from "../../../components/dashboard/UiKit";
import { IncomeOverviewChart, PaymentStatusChart } from "../../../components/dashboard/FinanceCharts";
import FinanceReportSection from "../../../components/dashboard/FinanceReportSection";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { dashboardApi } from "../../../api/dashboard";
import { propertiesApi } from "../../../api/properties";
import { payoutApi } from "../../../api/payout";
import { useAuth } from "../../../context/AuthContext";

const OWNERSHIP_FILTERS = [
  { value: "ALL", label: "Both" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "PERSONAL", label: "Personal" },
];

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
  const [payoutStatus, setPayoutStatus] = useState(null);

  useEffect(() => {
    Promise.all([dashboardApi.get(), propertiesApi.list()])
      .then(([dashRes, propsRes]) => {
        setData(dashRes.data);
        setProperties(propsRes.data);
      })
      .catch((err) => setError(err.message));
    if (user.role === "landlord") {
      payoutApi.status().then((res) => setPayoutStatus(res.data)).catch(() => {});
    }
  }, [user.role]);

  const filteredProperties = properties?.filter((p) => ownershipFilter === "ALL" || p.ownershipType === ownershipFilter) || [];

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title={`Welcome, ${user.fullName?.split(" ")[0]}`}
      subtitle="Each property tracked on its own — nothing combined"
    >
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {payoutStatus && !payoutStatus.payoutVerified && (
        <Link
          to="/dashboard/staff/payout-setup"
          className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
        >
          <FaExclamationTriangle size={16} className="shrink-0" />
          <span className="flex-1">
            <span className="font-bold">⚠️ Payout setup required</span> — online rent collection is blocked until you add
            your bank details.
          </span>
          <FaArrowRight size={12} className="shrink-0" />
        </Link>
      )}
      {payoutStatus?.payoutVerified && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3.5 text-sm font-medium text-green-700">
          <FaCheckCircle size={16} className="shrink-0" />
          <span>✅ Payouts verified — tenants and shop owners can pay rent online.</span>
        </div>
      )}

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

          <FinanceReportSection finance={data.finance} title="Finance Report (All Properties)" />

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
