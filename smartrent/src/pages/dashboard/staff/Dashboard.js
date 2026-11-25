import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaArrowRight,
  FaDoorOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaHome,
  FaUsers,
  FaMoneyBillWave,
  FaChevronRight,
  FaCalendarAlt,
  FaPlus,
  FaCreditCard,
  FaTools,
  FaChartBar,
  FaChartPie,
  FaBolt,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatNaira, formatNairaCompact } from "../../../components/dashboard/UiKit";
import FinanceReportSection from "../../../components/dashboard/FinanceReportSection";
import QuickRecordPayment from "../../../components/dashboard/QuickRecordPayment";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { dashboardApi } from "../../../api/dashboard";
import { propertiesApi } from "../../../api/properties";
import { payoutApi } from "../../../api/payout";
import { paymentsApi } from "../../../api/payments";
import { maintenanceApi } from "../../../api/maintenance";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../api/client";

const OWNERSHIP_FILTERS = [
  { value: "ALL", label: "Both" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "PERSONAL", label: "Personal" },
];

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";
const panel = "min-w-0 rounded-[18px] border border-[#EFE6D6] bg-white p-5 sm:p-6";
const panelTitle = "m-0 flex items-center gap-2.5 font-display text-xl font-bold text-site-text";
const textLink = `inline-flex items-center gap-1.5 rounded font-semibold text-brand-700 hover:underline ${ring}`;

function greetingNow() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  const time = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  if (mins < 60 * 24 && d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

// --- Headline cards ---------------------------------------------------------
function KpiCard({ to, icon: Icon, label, value, title, tone = "plain" }) {
  const tones = {
    plain: { card: "border-[#EFE6D6] bg-white", icon: "text-brand-700", value: "text-site-text", chev: "bg-[#F6E7BC] text-brand-700" },
    green: { card: "border-[#EFE6D6] bg-white", icon: "text-[#1F6B3A]", value: "text-site-text", chev: "bg-[#E3F2E7] text-[#1F6B3A]" },
    red: { card: "border-[#F2C9C9] bg-[#FDF1F1]", icon: "text-[#8A1C1C]", value: "text-[#8A1C1C]", chev: "bg-[#FBE6E6] text-[#8A1C1C]" },
  }[tone];
  return (
    <Link
      to={to}
      className={`flex min-w-0 items-center gap-3.5 rounded-[18px] border p-4 transition-[transform,box-shadow] duration-200 hover:shadow-[0_10px_24px_rgba(60,10,10,0.10)] motion-safe:hover:-translate-y-0.5 ${tones.card} ${ring}`}
    >
      <Icon size={30} className={`shrink-0 ${tones.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium leading-tight text-site-muted">{label}</div>
        <div className={`truncate font-display text-[24px] font-bold leading-tight ${tones.value}`} title={title}>
          {value}
        </div>
      </div>
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tones.chev}`} aria-hidden="true">
        <FaChevronRight size={11} />
      </span>
    </Link>
  );
}

// --- Rent Collection Overview (Jan–Dec this year) ---------------------------
function RentCollectionChart({ series, total }) {
  const max = Math.max(...series.map((s) => s.total), 1);
  const nowMonth = new Date().getMonth();
  const summary = series.map((s) => `${s.month}: ${formatNaira(s.total)}`).join(", ");
  return (
    <div className={`${panel} flex-[2_1_480px]`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={panelTitle}>
          <FaChartBar className="text-brand-700" aria-hidden="true" /> Rent Collection Overview
        </h2>
        <span className="rounded-xl border border-site-border px-3 py-1.5 text-sm font-semibold">This year ({new Date().getFullYear()})</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-site-muted">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-700" aria-hidden="true" /> Collected · <b className="text-site-text">{formatNaira(total)}</b> so far
      </div>
      <div className="mt-4 flex h-[210px] items-end gap-1.5 border-b border-site-border sm:gap-2.5" role="img" aria-label={`Rent collected per month this year. ${summary}`}>
        {series.map((s, i) => (
          <div key={s.month} className="flex h-full flex-1 flex-col items-center justify-end">
            {s.total > 0 && <span className="mb-1 hidden text-[10px] text-site-muted sm:block">{formatNairaCompact(s.total)}</span>}
            <div
              className={`w-full max-w-[34px] rounded-t-md ${i === nowMonth ? "bg-gold-500" : i < nowMonth ? "bg-brand-700" : "bg-[#EEE6D8]"}`}
              style={{ height: `${s.total > 0 ? Math.max((s.total / max) * 170, 4) : 3}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 text-[11px] text-site-muted sm:gap-2.5 sm:text-xs" aria-hidden="true">
        {series.map((s, i) => (
          <span key={s.month} className={`flex-1 text-center ${i === nowMonth ? "font-bold text-site-text" : ""}`}>
            {s.month}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Portfolio Occupancy donut ---------------------------------------------
function OccupancyDonut({ overall, byOwnership }) {
  const pct = overall.totalRooms ? Math.round((overall.occupiedRooms / overall.totalRooms) * 100) : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const rows = [
    { label: "Organization", b: byOwnership.organization },
    { label: "Personal", b: byOwnership.personal },
  ].filter((x) => x.b.totalRooms > 0);
  return (
    <div className={`${panel} flex-[1_1_300px]`}>
      <h2 className={panelTitle}>
        <FaChartPie className="text-brand-700" aria-hidden="true" /> Portfolio Occupancy
      </h2>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
        <div className="relative h-[140px] w-[140px]" role="img" aria-label={`${pct}% occupied: ${overall.occupiedRooms} occupied, ${overall.vacantRooms} vacant`}>
          <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r={r} fill="none" stroke="#EEE6D8" strokeWidth="16" />
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke="#5C1010"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * c} ${c}`}
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[28px] font-bold leading-none">{pct}%</span>
            <span className="text-xs text-site-muted">Occupied</span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-3 w-3 rounded-full bg-brand-700" aria-hidden="true" />
            <div>
              <div className="font-semibold">Occupied</div>
              <div className="text-site-muted">{overall.occupiedRooms} units</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1 h-3 w-3 rounded-full bg-[#D9CFBD]" aria-hidden="true" />
            <div>
              <div className="font-semibold">Vacant</div>
              <div className="text-site-muted">{overall.vacantRooms} units</div>
            </div>
          </div>
        </div>
      </div>
      {rows.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-[#F3ECDF] pt-3 text-[13px]">
          {rows.map((x) => (
            <div key={x.label} className="flex justify-between">
              <span className="text-site-muted">{x.label}</span>
              <span className="font-semibold">
                {x.b.occupiedRooms} of {x.b.totalRooms} occupied
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Properties Overview table ---------------------------------------------
function PropertyRowThumb({ property }) {
  const icon = (
    <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-[#F6E7BC] text-brand-700">
      <FaBuilding size={15} aria-hidden="true" />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return (
    <div className="h-10 w-12 overflow-hidden rounded-lg bg-[#F6E7BC]">
      <AuthImage src={propertiesApi.photoUrl(property.id)} alt="" className="h-full w-full object-cover" fallback={icon} />
    </div>
  );
}

function PropertiesOverview({ properties }) {
  const total = properties.reduce(
    (t, p) => ({
      units: t.units + p.totalRooms,
      occupied: t.occupied + p.occupiedRooms,
      collected: t.collected + Number(p.collectedThisYear || 0),
      outstanding: t.outstanding + Number(p.outstanding || 0),
    }),
    { units: 0, occupied: 0, collected: 0, outstanding: 0 }
  );
  return (
    <div className={`${panel} flex-[2_1_520px] px-0 pb-2 sm:px-0`}>
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6">
        <h2 className={panelTitle}>
          <FaBuilding className="text-brand-700" aria-hidden="true" /> Properties Overview
        </h2>
        <Link to="/dashboard/staff/properties" className={`text-sm ${textLink}`}>
          View all <FaArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
      {properties.length === 0 ? (
        <p className="px-6 pt-4 text-sm text-site-muted">No properties yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="bg-site-cream text-left text-[13px] text-site-muted">
                <th className="px-5 py-2.5 font-semibold sm:px-6">Property Name</th>
                <th className="px-2 py-2.5 text-center font-semibold">Total Units</th>
                <th className="px-2 py-2.5 text-center font-semibold">Occupied</th>
                <th className="px-2 py-2.5 text-right font-semibold">Collected (YTD)</th>
                <th className="px-2 py-2.5 text-right font-semibold">Outstanding</th>
                <th className="px-5 py-2.5 text-right font-semibold sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-[#F3ECDF]">
                  <td className="px-5 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <PropertyRowThumb property={p} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">{p.totalRooms}</td>
                  <td className="px-2 py-3 text-center">{p.occupiedRooms}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right font-semibold text-[#1F6B3A]">{formatNaira(p.collectedThisYear || 0)}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right font-semibold text-[#8A1C1C]">{formatNaira(p.outstanding || 0)}</td>
                  <td className="px-5 py-3 text-right sm:px-6">
                    <Link
                      to={`/dashboard/staff/properties/${p.id}`}
                      className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#F6E7BC] px-3 text-xs font-bold text-brand-700 hover:bg-[#EFD995] ${ring}`}
                    >
                      View Details <FaChevronRight size={9} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-site-cream font-bold">
                <td className="px-5 py-3 sm:px-6">Total</td>
                <td className="px-2 py-3 text-center">{total.units}</td>
                <td className="px-2 py-3 text-center">{total.occupied}</td>
                <td className="whitespace-nowrap px-2 py-3 text-right text-[#1F6B3A]">{formatNaira(total.collected)}</td>
                <td className="whitespace-nowrap px-2 py-3 text-right text-[#8A1C1C]">{formatNaira(total.outstanding)}</td>
                <td className="px-5 sm:px-6" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Attention Required + Recent Activity -----------------------------------
function AttentionRequired({ arrears, totalOwing, pendingMaintenance }) {
  const items = [
    {
      icon: FaExclamationCircle,
      iconCls: "text-[#8A1C1C]",
      title: `${arrears.length} tenant${arrears.length === 1 ? "" : "s"} in arrears`,
      sub: totalOwing > 0 ? `Owing: ${formatNaira(totalOwing)}` : "Part-paid or no payment yet",
      to: "/dashboard/staff/tenants",
      btn: "bg-[#FBE6E6] text-[#8A1C1C] hover:bg-[#F6D3D3]",
      show: arrears.length > 0,
    },
    {
      icon: FaTools,
      iconCls: "text-brand-700",
      title: `${pendingMaintenance} maintenance request${pendingMaintenance === 1 ? "" : "s"}`,
      sub: "Pending action",
      to: "/dashboard/staff/maintenance",
      btn: "bg-[#F6E7BC] text-brand-700 hover:bg-[#EFD995]",
      show: pendingMaintenance > 0,
    },
  ].filter((i) => i.show);

  return (
    <div className={panel}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={panelTitle}>
          <FaExclamationCircle className="text-[#8A1C1C]" aria-hidden="true" /> Attention Required
        </h2>
        <Link to="/dashboard/staff/tenants" className={`text-sm ${textLink}`}>
          View all <FaArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="m-0 mt-3 text-sm text-site-muted">Nothing needs attention right now.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {items.map((i) => (
            <li key={i.title} className="flex items-center gap-3 border-t border-[#F3ECDF] py-3 first:border-t-0">
              <i.icon size={22} className={`shrink-0 ${i.iconCls}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{i.title}</div>
                <div className="text-[13px] text-site-muted">{i.sub}</div>
              </div>
              <Link to={i.to} className={`inline-flex min-h-[36px] items-center rounded-lg px-3.5 text-sm font-bold ${i.btn} ${ring}`}>
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ACTIVITY = {
  CREATED: { icon: FaCheckCircle, cls: "text-[#1F6B3A]", verb: "Payment recorded" },
  EDITED: { icon: FaEdit, cls: "text-[#8C670C]", verb: "Payment edited" },
  DELETED: { icon: FaTrash, cls: "text-[#8A1C1C]", verb: "Payment deleted" },
};

const ROLE_WORD = { LANDLORD: "landlord", SECRETARY: "secretary" };

// One shape for both payment-audit rows and the wider staff activity log.
function activityItems(auditLogs, staffActivity) {
  if (auditLogs === null || staffActivity === null) return null;
  const payments = auditLogs.map((log) => {
    const a = ACTIVITY[log.action] || ACTIVITY.EDITED;
    const amount = log.newData?.amount ?? log.previousData?.amount;
    return {
      id: `p-${log.id}`,
      icon: a.icon,
      cls: a.cls,
      title: `${a.verb}${amount !== undefined ? ` — ${formatNaira(amount)}` : ""}`,
      at: log.createdAt,
      by: `${log.performedByName}${ROLE_WORD[log.performedByRole] ? ` (${ROLE_WORD[log.performedByRole]})` : ""}`,
    };
  });
  const others = staffActivity.map((a) => {
    const red = /DELETED|REMOVED|ENDED|PAYOUT/.test(a.action);
    const look = /VIEWED|DOWNLOADED|PRINTED/.test(a.action);
    return {
      id: `s-${a.id}`,
      icon: red ? FaTrash : look ? FaEye : /ADDED|REGISTERED|UPLOADED|SENT|INVITED|JOINED|GENERATED|LOGGED/.test(a.action) ? FaCheckCircle : FaEdit,
      cls: red ? "text-[#8A1C1C]" : look ? "text-site-muted" : "text-[#8C670C]",
      title: a.summary,
      at: a.createdAt,
      by: `${a.actorName} (${ROLE_WORD[a.actorRole] || "staff"})`,
    };
  });
  return [...payments, ...others].sort((x, y) => new Date(y.at) - new Date(x.at));
}

function RecentActivity({ logs }) {
  return (
    <div className={panel}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={panelTitle}>
          <FaBolt className="text-gold-600" aria-hidden="true" /> Recent Activity
        </h2>
        <Link to="/dashboard/staff/history" className={`text-sm ${textLink}`}>
          View all <FaArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
      {logs === null ? (
        <p className="m-0 mt-3 text-sm text-site-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="m-0 mt-3 text-sm text-site-muted">No activity yet.</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {logs.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex gap-3 border-t border-[#F3ECDF] py-2.5 first:border-t-0">
                <Icon size={18} className={`mt-0.5 shrink-0 ${item.cls}`} aria-hidden="true" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold [overflow-wrap:anywhere]">{item.title}</div>
                  <div className="flex flex-wrap justify-between gap-x-3 text-xs text-site-muted">
                    <span>{timeAgo(item.at)}</span>
                    <span>by {item.by}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// --- Kept from the earlier dashboard ----------------------------------------
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
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#EEE6D8]" role="img" aria-label={segments.map((s) => `${s.label}: ${s.count} (${pct(s.count)}%)`).join(", ")}>
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

function PropertyOverviewCard({ property }) {
  return (
    <Link
      to={`/dashboard/staff/properties/${property.id}`}
      className={`block rounded-[18px] border border-[#EFE6D6] bg-white p-5 transition-[transform,box-shadow] duration-200 hover:shadow-[0_12px_28px_rgba(60,10,10,0.12)] motion-safe:hover:-translate-y-0.5 ${ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PropertyRowThumb property={property} />
          <div className="min-w-0">
            <h3 className="m-0 text-[15px] font-bold text-site-text">{property.name}</h3>
            <p className="m-0 line-clamp-2 text-xs text-site-muted">{property.address}</p>
          </div>
        </div>
        <Badge tone={property.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
          {property.ownershipType === "ORGANIZATION" ? "Organization" : "Personal"}
        </Badge>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-site-muted">
          <span>
            {property.occupiedRooms} of {property.totalRooms} occupied · {property.tenantCount} tenants
          </span>
          <span>{property.occupancyRate}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEE6D8]">
          <div className="h-full rounded-full bg-brand-700" style={{ width: `${property.occupancyRate}%` }} />
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
  const [auditLogs, setAuditLogs] = useState(null);
  const [staffActivity, setStaffActivity] = useState(null);
  const [pendingMaintenance, setPendingMaintenance] = useState(0);

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
    maintenanceApi
      .listForStaff("PENDING")
      .then((res) => setPendingMaintenance(res.data.length))
      .catch(() => {});
    if (user.role === "landlord") {
      api
        .get("/landlord/activity?limit=20")
        .then((res) => setStaffActivity(res.data))
        .catch(() => setStaffActivity([]));
    } else {
      setStaffActivity([]);
    }
    if (user.role === "landlord") {
      payoutApi.status().then((res) => setPayoutStatus(res.data)).catch(() => {});
    }
  }, [user.role]);

  const filteredProperties = properties?.filter((p) => ownershipFilter === "ALL" || p.ownershipType === ownershipFilter) || [];
  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const actions = (
    <>
      <Link
        to="/dashboard/staff/properties?add=1"
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-5 font-bold text-white transition hover:bg-brand-800 motion-safe:hover:-translate-y-0.5 ${ring}`}
      >
        <FaPlus size={12} aria-hidden="true" /> Add Property
      </Link>
      <Link
        to="/dashboard/staff/tenants"
        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border-[1.5px] border-brand-700 bg-white px-5 font-bold text-brand-700 transition hover:bg-site-cream motion-safe:hover:-translate-y-0.5 ${ring}`}
      >
        <FaCreditCard size={13} aria-hidden="true" /> Record Payment
      </Link>
    </>
  );

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title={`${greetingNow()}, ${user.fullName?.split(" ")[0]}`}
      subtitle={
        <>
          <span>Here's what's happening with your properties today.</span>
          <span className="mt-1.5 flex items-center gap-2 font-semibold text-site-text">
            <FaCalendarAlt className="text-brand-700" aria-hidden="true" /> {today}
          </span>
        </>
      }
      actions={user.role === "secretary" ? null : actions}
    >
      {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

      {payoutStatus && !payoutStatus.payoutVerified && (
        <Link
          to="/dashboard/staff/payout-setup"
          className={`mb-4 flex items-center gap-3 rounded-xl bg-[#FFF1CC] px-4 py-3.5 text-sm font-medium text-[#6B4E00] transition hover:bg-[#FBE7A8] ${ring}`}
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

      {user.role === "secretary" && <QuickRecordPayment />}

      {!data && !error && <EmptyState title="Loading dashboard…" />}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3 sm:gap-4">
            <KpiCard to="/dashboard/staff/properties" icon={FaHome} label="Total Properties" value={data.overall.totalProperties} />
            <KpiCard to="/dashboard/staff/properties" icon={FaDoorOpen} label="Total Units" value={data.overall.totalRooms} tone="green" />
            <KpiCard to="/dashboard/staff/tenants" icon={FaUsers} label="Occupied / Vacant" value={`${data.overall.occupiedRooms} / ${data.overall.vacantRooms}`} />
            <KpiCard
              to="/dashboard/staff/payments"
              icon={FaMoneyBillWave}
              label="Rent Collected This Year"
              value={formatNairaCompact(data.finance.collectedThisYear || 0)}
              title={formatNaira(data.finance.collectedThisYear || 0)}
              tone="green"
            />
            <KpiCard
              to="/dashboard/staff/tenants"
              icon={FaExclamationCircle}
              label="Outstanding"
              value={formatNairaCompact((properties || []).reduce((s, p) => s + Number(p.outstanding || 0), 0))}
              title={formatNaira((properties || []).reduce((s, p) => s + Number(p.outstanding || 0), 0))}
              tone="red"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <RentCollectionChart series={data.finance.yearSeries || []} total={data.finance.collectedThisYear || 0} />
            <OccupancyDonut overall={data.overall} byOwnership={data.byOwnership} />
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <PropertiesOverview properties={properties || []} />
            <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
              <AttentionRequired arrears={data.finance.tenantsInArrears} totalOwing={data.finance.totalOwing} pendingMaintenance={pendingMaintenance} />
              <RecentActivity logs={activityItems(auditLogs, staffActivity)} />
            </div>
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
                    className={`min-h-[40px] rounded-lg px-3.5 text-xs font-bold transition ${ring} ${
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
            <Link to="/dashboard/staff/properties" className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white transition hover:bg-brand-800 ${ring}`}>
              Manage Properties <FaArrowRight size={12} aria-hidden="true" />
            </Link>
            <Link
              to="/dashboard/staff/tenants"
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-site-border bg-white px-5 text-sm font-bold text-site-text transition hover:border-brand-300 ${ring}`}
            >
              Manage Tenants <FaArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
