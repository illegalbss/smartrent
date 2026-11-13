import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaArrowRight, FaDoorOpen, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatNaira, formatNairaCompact } from "../../../components/dashboard/UiKit";
import FinanceReportSection from "../../../components/dashboard/FinanceReportSection";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { dashboardApi } from "../../../api/dashboard";
import { propertiesApi } from "../../../api/properties";
import { payoutApi } from "../../../api/payout";
import { paymentsApi } from "../../../api/payments";
import { useAuth } from "../../../context/AuthContext";

const OWNERSHIP_FILTERS = [
  { value: "ALL", label: "Both" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "PERSONAL", label: "Personal" },
];

const ARREARS_CHIP = {
  OWING: { tone: "red", label: "Owing" },
  PARTIAL: { tone: "amber", label: "Part-paid" },
  NO_PAYMENTS: { tone: "ink", label: "No payments" },
};

const AUDIT_VERB = { CREATED: "recorded", EDITED: "edited a payment of", DELETED: "deleted a payment of" };

const panel = "min-w-0 rounded-[18px] border border-[#EFE6D6] bg-white p-5 sm:p-6";
const panelTitle = "m-0 font-display text-xl font-bold text-site-text";
const textLink = "rounded font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

function greetingNow() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function timeAgo(dateStr) {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function PropertyThumb({ property }) {
  const icon = (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6E7BC] text-brand-700">
      <FaBuilding size={18} />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return (
    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[#F6E7BC]">
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
      className="block rounded-[18px] border border-[#EFE6D6] bg-white p-5 transition-[transform,box-shadow] duration-200 hover:shadow-[0_12px_28px_rgba(60,10,10,0.12)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PropertyThumb property={property} />
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-bold text-site-text">{property.name}</h3>
            <p className="m-0 line-clamp-2 text-xs text-site-muted">{property.address}</p>
          </div>
        </div>
        <Badge tone={property.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
          {property.ownershipType === "ORGANIZATION" ? "Organization" : "Personal"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Rooms", value: property.totalRooms, color: "text-site-text" },
          { label: "Occupied", value: property.occupiedRooms, color: "text-[#1F6B3A]" },
          { label: "Tenants", value: property.tenantCount, color: "text-site-text" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-site-cream py-2">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-semibold uppercase text-site-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-site-muted">
          <span>Occupancy</span>
          <span>{property.occupancyRate}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEE6D8]">
          <div className="h-full rounded-full bg-brand-700" style={{ width: `${property.occupancyRate}%` }} />
        </div>
      </div>
    </Link>
  );
}

// Last 6 months of rent received, as simple bars (current month in maroon).
function RentBars({ series }) {
  const max = Math.max(...series.map((s) => s.total), 1);
  const summary = series.map((s) => `${s.month}: ${formatNaira(s.total)}`).join(", ");
  return (
    <div className={`${panel} flex-[2_1_420px]`}>
      <h2 className={panelTitle}>Rent received, last 6 months</h2>
      <div className="mt-5 flex h-[200px] items-end gap-2 border-b border-site-border sm:gap-3.5" role="img" aria-label={`Rent received by month. ${summary}`}>
        {series.map((s, i) => {
          const isCurrent = i === series.length - 1;
          return (
            <div key={s.month} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className={`mb-1 text-[11px] sm:text-xs ${isCurrent ? "font-bold text-site-text" : "text-site-muted"}`}>
                {formatNairaCompact(s.total)}
              </span>
              <div
                className={`w-full rounded-t-lg ${isCurrent ? "bg-brand-700" : "bg-[#E6C26A]"}`}
                style={{ height: `${Math.max((s.total / max) * 160, s.total > 0 ? 4 : 2)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 text-xs text-site-muted sm:gap-3.5" aria-hidden="true">
        {series.map((s, i) => (
          <span key={s.month} className={`flex-1 text-center ${i === series.length - 1 ? "font-bold text-site-text" : ""}`}>
            {s.month}
          </span>
        ))}
      </div>
    </div>
  );
}

function OccupancyByOwnership({ byOwnership }) {
  const rows = [
    { label: "Organization", bucket: byOwnership.organization, bar: "bg-brand-700" },
    { label: "Personal", bucket: byOwnership.personal, bar: "bg-gold-500" },
  ].filter((r) => r.bucket.totalRooms > 0);

  return (
    <div className={`${panel} flex-[1_1_280px]`}>
      <h2 className={panelTitle}>Occupancy</h2>
      {rows.length === 0 && <p className="mt-4 text-sm text-site-muted">No rooms added yet.</p>}
      {rows.map((r) => (
        <div key={r.label} className="mt-[18px]">
          <div className="flex justify-between text-sm">
            <span>{r.label}</span>
            <b>
              {r.bucket.occupiedRooms} of {r.bucket.totalRooms}
            </b>
          </div>
          <div
            className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#EEE6D8]"
            role="img"
            aria-label={`${r.label}: ${r.bucket.occupancyRate}% occupied`}
          >
            <div className={`h-full ${r.bar}`} style={{ width: `${r.bucket.occupancyRate}%` }} />
          </div>
        </div>
      ))}
      <Link to="/dashboard/staff/properties" className={`mt-6 inline-block text-sm ${textLink}`}>
        View properties
      </Link>
    </div>
  );
}

function NeedsAttention({ tenants }) {
  return (
    <div className={`${panel} flex-[2_1_420px]`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={panelTitle}>Needs attention</h2>
        <Link to="/dashboard/staff/tenants" className={`text-sm ${textLink}`}>
          All tenants
        </Link>
      </div>
      {tenants.length === 0 ? (
        <p className="mt-4 text-sm text-site-muted">Everyone is paid up. Nothing needs attention.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {tenants.slice(0, 6).map((t) => {
            const chip = ARREARS_CHIP[t.lastPaymentStatus] || ARREARS_CHIP.NO_PAYMENTS;
            return (
              <li key={t.tenantId} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#F3ECDF] py-3 first:border-t-0">
                {/* Phones: name/details on one line, chip + Open on the next. */}
                <div className="min-w-0 basis-full sm:basis-0 sm:flex-grow">
                  <b className="text-[15px]">{t.name}</b>
                  <div className="text-[13px] text-site-muted">
                    {t.room || "No room"}
                    {t.lastPaymentDate ? ` · last paid ${new Date(t.lastPaymentDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : ""}
                  </div>
                </div>
                <Badge tone={chip.tone}>{chip.label}</Badge>
                <Link to={`/dashboard/staff/tenants/${t.tenantId}`} className={`inline-flex min-h-[44px] items-center px-1 text-[13px] ${textLink}`}>
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {tenants.length > 6 && <p className="m-0 mt-1 text-[13px] text-site-muted">and {tenants.length - 6} more</p>}
    </div>
  );
}

// How all recorded payments split between Paid / Partial / Owing — one
// stacked bar plus the counts (the same figures the old pie chart showed).
function PaymentStatusStrip({ byStatus }) {
  const segments = [
    { key: "PAID", label: "Paid", bar: "bg-[#1F6B3A]", tone: "green" },
    { key: "PARTIAL", label: "Partial", bar: "bg-gold-500", tone: "amber" },
    { key: "OWING", label: "Owing", bar: "bg-[#8A1C1C]", tone: "red" },
  ].map((s) => ({ ...s, count: byStatus[s.key].count }));
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className={panel}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={panelTitle}>Payment status</h2>
        <span className="text-[13px] text-site-muted">
          {total} payment{total === 1 ? "" : "s"} recorded
        </span>
      </div>
      {total === 0 ? (
        <p className="mt-4 text-sm text-site-muted">No payments recorded yet.</p>
      ) : (
        <>
          <div
            className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#EEE6D8]"
            role="img"
            aria-label={segments.map((s) => `${s.label}: ${s.count} (${pct(s.count)}%)`).join(", ")}
          >
            {segments.map((s) => s.count > 0 && <div key={s.key} className={s.bar} style={{ width: `${pct(s.count)}%` }} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {segments.map((s) => (
              <span key={s.key} className="flex items-center gap-2">
                <Badge tone={s.tone}>{s.label}</Badge>
                <b>{s.count}</b>
                <span className="text-site-muted">({pct(s.count)}%)</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecentActivity({ logs }) {
  return (
    <div className={`${panel} flex-[1_1_280px]`}>
      <h2 className={panelTitle}>Recent activity</h2>
      {logs === null ? (
        <p className="mt-4 text-sm text-site-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-site-muted">No payment activity yet.</p>
      ) : (
        <ul className="m-0 mt-3.5 flex list-none flex-col gap-3.5 p-0 text-sm leading-snug">
          {logs.slice(0, 5).map((log) => {
            const amount = log.newData?.amount ?? log.previousData?.amount;
            return (
              <li key={log.id}>
                <b>{log.performedByName}</b> <span className="text-site-muted">({log.performedByRole.toLowerCase()})</span>{" "}
                {AUDIT_VERB[log.action] || "changed"} {amount !== undefined ? formatNaira(amount) : "a payment"}
                <div className="text-xs text-site-muted">{timeAgo(log.createdAt)}</div>
              </li>
            );
          })}
        </ul>
      )}
      <Link to="/dashboard/staff/payments" className={`mt-[18px] inline-block text-sm ${textLink}`}>
        Open payment ledger
      </Link>
    </div>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState(null);
  const [ownershipFilter, setOwnershipFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [payoutStatus, setPayoutStatus] = useState(null);
  const [auditLogs, setAuditLogs] = useState(null);

  useEffect(() => {
    Promise.all([dashboardApi.get(), propertiesApi.list()])
      .then(([dashRes, propsRes]) => {
        setData(dashRes.data);
        setProperties(propsRes.data);
      })
      .catch((err) => setError(err.message));
    paymentsApi
      .auditLog()
      .then((res) => setAuditLogs(res.data))
      .catch(() => setAuditLogs([]));
    if (user.role === "landlord") {
      payoutApi.status().then((res) => setPayoutStatus(res.data)).catch(() => {});
    }
  }, [user.role]);

  const filteredProperties = properties?.filter((p) => ownershipFilter === "ALL" || p.ownershipType === ownershipFilter) || [];

  return (
    <DashboardShell navItems={STAFF_NAV} title="Your rent at a glance" subtitle={`${greetingNow()}, ${user.fullName?.split(" ")[0]}`}>
      {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

      {payoutStatus && !payoutStatus.payoutVerified && (
        <Link
          to="/dashboard/staff/payout-setup"
          className="mb-4 flex items-center gap-3 rounded-xl bg-[#FFF1CC] px-4 py-3.5 text-sm font-medium text-[#6B4E00] transition hover:bg-[#FBE7A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <FaExclamationTriangle size={16} className="shrink-0" aria-hidden="true" />
          <span className="flex-1">
            <span className="font-bold">Payout setup required</span> — online rent collection is blocked until you add your bank details.
          </span>
          <FaArrowRight size={12} className="shrink-0" aria-hidden="true" />
        </Link>
      )}
      {payoutStatus?.payoutVerified && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#E3F2E7] px-4 py-3.5 text-sm font-medium text-[#1F6B3A]">
          <FaCheckCircle size={16} className="shrink-0" aria-hidden="true" />
          <span>Payouts verified — tenants and shop owners can pay rent online.</span>
        </div>
      )}

      {!data && !error && <EmptyState title="Loading dashboard…" />}

      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2.5">
            <Link
              to="/dashboard/staff/tenants"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-gold-500 px-5 font-bold text-site-text transition motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:ring-offset-site-cream"
            >
              Record payment
            </Link>
          </div>

          {/* Headline numbers */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-4">
            <div className="rounded-[18px] bg-brand-700 p-5 text-white">
              <div className="text-[13px] text-[#F3D9A0]">Received this month</div>
              <div className="mt-1 truncate font-display text-[30px] font-bold" title={formatNaira(data.finance.collectedThisMonth)}>
                {formatNairaCompact(data.finance.collectedThisMonth)}
              </div>
              <div className="mt-2.5 text-xs text-[#F3D9A0]">{formatNairaCompact(data.finance.totalCollected)} collected in total</div>
            </div>
            <div className="rounded-[18px] bg-[#FBE6E6] p-5 text-[#8A1C1C]">
              <div className="text-[13px]">Owing</div>
              <div className="mt-1 truncate font-display text-[30px] font-bold" title={formatNaira(data.finance.totalOwing)}>
                {formatNairaCompact(data.finance.totalOwing)}
              </div>
              <div className="mt-2.5 text-[13px]">
                {data.finance.tenantsInArrears.length} tenant{data.finance.tenantsInArrears.length === 1 ? "" : "s"} in arrears
              </div>
            </div>
            <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
              <div className="text-[13px] text-site-muted">Occupancy</div>
              <div className="mt-1 whitespace-nowrap font-display text-[30px] font-bold">
                {data.overall.occupiedRooms} of {data.overall.totalRooms}
              </div>
              <div className="mt-2.5 text-[13px] text-site-muted">
                rooms filled · {data.overall.vacantRooms} vacant · {data.overall.totalProperties} propert
                {data.overall.totalProperties === 1 ? "y" : "ies"}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
              <div className="text-[13px] text-site-muted">Tenants</div>
              <div className="mt-1 font-display text-[30px] font-bold">{data.totalTenants}</div>
              <Link to="/dashboard/staff/complaints" className={`mt-2.5 inline-block text-[13px] ${textLink}`}>
                {data.openComplaints} open complaint{data.openComplaints === 1 ? "" : "s"}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <RentBars series={data.finance.monthlySeries} />
            <OccupancyByOwnership byOwnership={data.byOwnership} />
          </div>

          <div className="flex flex-wrap gap-4">
            <NeedsAttention tenants={data.finance.tenantsInArrears} />
            <RecentActivity logs={auditLogs} />
          </div>

          <PaymentStatusStrip byStatus={data.finance.byStatus} />

          <section className="pt-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="m-0 font-display text-2xl font-bold">Your properties</h2>
              <div className="flex rounded-xl border border-site-border bg-white p-1" role="group" aria-label="Filter by ownership">
                {OWNERSHIP_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setOwnershipFilter(f.value)}
                    aria-pressed={ownershipFilter === f.value}
                    className={`min-h-[40px] rounded-lg px-3.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                      ownershipFilter === f.value ? "bg-brand-700 text-white" : "text-site-muted hover:text-site-text"
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
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
                {filteredProperties.map((p) => (
                  <PropertyOverviewCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </section>

          <FinanceReportSection finance={data.finance} title="Finance Report (All Properties)" />

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/staff/properties"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              Manage Properties <FaArrowRight size={12} aria-hidden="true" />
            </Link>
            <Link
              to="/dashboard/staff/tenants"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-site-border bg-white px-5 text-sm font-bold text-site-text transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              Manage Tenants <FaArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
