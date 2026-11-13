import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaArrowRight, FaSearch, FaWhatsapp } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatNairaCompact, formatNaira, formatDate } from "../../../components/dashboard/UiKit";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { propertiesApi } from "../../../api/properties";
import { tenantsApi } from "../../../api/tenants";
import { whatsappUrl } from "../../../utils/whatsapp";

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

// One status per tenant for the list: being past due wins, then what their
// latest payment says.
function statusOf(t) {
  if (t.isOverdue) return "OVERDUE";
  if (t.lastPaymentStatus === "PARTIAL") return "PARTIAL";
  if (t.lastPaymentStatus === "PAID") return "PAID";
  if (t.lastPaymentStatus === "OWING") return "OWING";
  return "NONE";
}
const STATUS = {
  OVERDUE: { label: "Overdue", tone: "red" },
  OWING: { label: "Owing", tone: "red" },
  PARTIAL: { label: "Part-paid", tone: "amber" },
  PAID: { label: "Paid", tone: "green" },
  NONE: { label: "No payments", tone: "ink" },
};
const FILTERS = [
  { key: "ALL", label: "All", match: () => true },
  { key: "OVERDUE", label: "Overdue", match: (s) => s === "OVERDUE" || s === "OWING" },
  { key: "PARTIAL", label: "Part-paid", match: (s) => s === "PARTIAL" },
  { key: "PAID", label: "Paid", match: (s) => s === "PAID" },
];

function unitText(t) {
  return t.room ? `${t.room.propertyName} · ${t.room.roomNumber}` : "No unit";
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function reminderMessage(t) {
  const due = t.nextDueDate ? ` due on ${formatDate(t.nextDueDate)}` : "";
  return `Hello ${t.name}, this is a friendly reminder that your rent${due} has an outstanding balance of ${formatNaira(
    t.outstanding
  )}. Please let us know when you have paid. Thank you.`;
}

function TenantPanel({ tenant }) {
  if (!tenant) {
    return (
      <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-6 text-sm text-site-muted">
        Select a tenant to see their balance and quick actions.
      </div>
    );
  }
  const status = statusOf(tenant);
  const owes = Number(tenant.outstanding) > 0;
  const daysLate = tenant.isOverdue && tenant.daysUntilDue != null ? Math.abs(tenant.daysUntilDue) : null;

  return (
    <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-6" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#F6E7BC] font-display text-xl font-bold text-brand-700">
          {initials(tenant.name)}
        </div>
        <div className="min-w-0">
          <h2 className="m-0 truncate font-display text-xl font-bold">{tenant.name}</h2>
          <div className="truncate text-[13px] text-site-muted">{unitText(tenant)}</div>
        </div>
      </div>

      <div className={`mt-[18px] rounded-xl p-3.5 ${owes ? "bg-[#FBE6E6] text-[#8A1C1C]" : "bg-[#E3F2E7] text-[#1F6B3A]"}`}>
        <div className="text-xs">{owes ? "Balance due" : "Balance"}</div>
        <div className="font-display text-[28px] font-bold">{formatNaira(tenant.outstanding)}</div>
        <div className="text-xs">
          {daysLate !== null ? `${daysLate} day${daysLate === 1 ? "" : "s"} late` : STATUS[status].label}
        </div>
      </div>

      <dl className="m-0 mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-site-muted">Phone</dt>
          <dd className="m-0 font-semibold">{tenant.phone || "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-site-muted">Next due</dt>
          <dd className="m-0 font-semibold">{tenant.nextDueDate ? formatDate(tenant.nextDueDate) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-site-muted">Last payment</dt>
          <dd className="m-0 text-right font-semibold">
            {tenant.dateOfLastPayment ? `${formatDate(tenant.dateOfLastPayment)} · ${formatNaira(tenant.lastPaymentAmount)}` : "None yet"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-site-muted">Lease ends</dt>
          <dd className="m-0 font-semibold">{tenant.dateExpiration ? formatDate(tenant.dateExpiration) : "—"}</dd>
        </div>
      </dl>

      <div className="mt-[18px] flex flex-col gap-2.5">
        <Link
          to={`/dashboard/staff/tenants/${tenant.id}`}
          className={`flex min-h-[48px] items-center justify-center rounded-xl bg-brand-700 font-bold text-white transition motion-safe:hover:-translate-y-0.5 ${ring}`}
        >
          Record payment
        </Link>
        {tenant.phone && owes && (
          <a
            href={whatsappUrl(tenant.phone, reminderMessage(tenant))}
            target="_blank"
            rel="noreferrer"
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-[1.5px] border-brand-700 bg-white font-bold text-brand-700 transition motion-safe:hover:-translate-y-0.5 ${ring}`}
          >
            <FaWhatsapp size={16} aria-hidden="true" /> Send WhatsApp reminder
          </a>
        )}
        <Link to={`/dashboard/staff/tenants/${tenant.id}`} className={`mt-1 text-center text-sm font-semibold text-brand-700 hover:underline ${ring}`}>
          Open full profile, documents and history
        </Link>
      </div>
    </div>
  );
}

function PropertyThumb({ property }) {
  const icon = (
    <div className="flex h-full w-full items-center justify-center bg-[#F6E7BC] text-brand-700">
      <FaBuilding size={28} />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return <AuthImage src={propertiesApi.photoUrl(property.id)} alt={property.name} className="h-full w-full object-cover" fallback={icon} />;
}

function PropertySelectorCard({ property }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[18px] border border-[#EFE6D6] bg-white transition-[transform,box-shadow] duration-200 hover:shadow-[0_12px_28px_rgba(60,10,10,0.12)] motion-safe:hover:-translate-y-0.5">
      <div className="h-28 overflow-hidden bg-site-cream">
        <PropertyThumb property={property} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 font-display text-lg font-bold">{property.name}</h3>
          <Badge tone="green">Active</Badge>
        </div>
        <p className="m-0 mt-1 line-clamp-2 text-xs text-site-muted" title={property.address}>
          {property.address}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Rooms", value: property.totalRooms, color: "text-site-text" },
            { label: "Occupied", value: property.occupiedRooms, color: "text-[#1F6B3A]" },
            { label: "Vacant", value: property.vacantRooms, color: "text-[#8C670C]" },
            { label: "Tenants", value: property.tenantCount, color: "text-site-text" },
          ].map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col items-center rounded-xl bg-site-cream px-2 py-2.5 text-center">
              <span className={`text-xl font-bold leading-tight ${s.color}`}>{s.value}</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase text-site-muted">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-[#F3ECDF] pt-3.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-site-muted">Income Collected</span>
            <span className="font-bold text-[#1F6B3A]" title={formatNaira(property.monthlyIncome)}>
              {formatNairaCompact(property.monthlyIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-site-muted">Outstanding</span>
            <span className={`font-bold ${property.outstanding > 0 ? "text-[#8A1C1C]" : "text-[#1F6B3A]"}`} title={formatNaira(property.outstanding)}>
              {formatNairaCompact(property.outstanding)}
            </span>
          </div>
        </div>

        <Link
          to={`/dashboard/staff/properties/${property.id}/tenants`}
          className={`mt-4 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-700 text-sm font-bold text-white transition hover:bg-brand-800 ${ring}`}
        >
          View, register and export tenants <FaArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default function Tenants() {
  const [properties, setProperties] = useState(null);
  const [tenants, setTenants] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    propertiesApi
      .list()
      .then((res) => setProperties(res.data))
      .catch((err) => setError(err.message));
    tenantsApi
      .list({ limit: 500 })
      .then((res) => {
        setTenants(res.data);
        // Start on whoever most needs attention.
        const first = res.data.find((t) => ["OVERDUE", "OWING"].includes(statusOf(t))) || res.data[0];
        setSelectedId(first?.id || null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const counts = useMemo(() => {
    const c = Object.fromEntries(FILTERS.map((f) => [f.key, 0]));
    for (const t of tenants || []) for (const f of FILTERS) if (f.match(statusOf(t))) c[f.key] += 1;
    return c;
  }, [tenants]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = FILTERS.find((f) => f.key === filter).match;
    return (tenants || []).filter((t) => {
      if (!match(statusOf(t))) return false;
      if (!q) return true;
      return [t.name, t.phone, t.email, t.room?.roomNumber, t.room?.propertyName].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [tenants, search, filter]);

  const selected = tenants?.find((t) => t.id === selectedId) || null;

  function selectTenant(id) {
    setSelectedId(id);
    // On phones the panel sits below the list — bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 0);
    }
  }

  const propertySearch = search.trim().toLowerCase();
  const filteredProperties =
    properties?.filter((p) => !propertySearch || p.name.toLowerCase().includes(propertySearch) || p.address.toLowerCase().includes(propertySearch)) || [];

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title="Tenants"
      subtitle={tenants ? `${tenants.length} tenant${tenants.length === 1 ? "" : "s"} and shop owners` : "Everyone renting from you"}
    >
      <div className="mb-4 flex justify-end">
        <a
          href="#by-property"
          className={`inline-flex min-h-[44px] items-center rounded-xl bg-gold-500 px-5 font-bold text-site-text transition motion-safe:hover:-translate-y-0.5 ${ring}`}
        >
          Add tenant
        </a>
      </div>

      {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-[1_1_260px]">
          <label htmlFor="tenant-search" className="sr-only">
            Search tenants
          </label>
          <FaSearch size={13} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-site-muted" aria-hidden="true" />
          <input
            id="tenant-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, unit, property or phone"
            className="min-h-[44px] w-full rounded-xl border-[1.5px] border-[#D9CFBD] bg-white pl-10 pr-3.5 text-base text-site-text outline-none focus:border-brand-700 focus:ring-[3px] focus:ring-[#F0D58A]"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by payment status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`min-h-[44px] rounded-full px-[18px] text-sm font-semibold transition ${ring} ${
                filter === f.key ? "bg-brand-700 text-white" : "border-[1.5px] border-[#D9CFBD] bg-white text-site-text hover:border-brand-300"
              }`}
            >
              {f.label} {tenants ? counts[f.key] : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-[2_1_520px] rounded-[18px] border border-[#EFE6D6] bg-white px-3 pb-3 pt-1 sm:px-5">
          {!tenants ? (
            <p className="p-4 text-sm text-site-muted">Loading tenants…</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-sm text-site-muted">{tenants.length === 0 ? "No tenants yet." : "No tenants match this search or filter."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-site-muted">
                    <th className="border-b border-[#EEE6D8] px-2 py-3 font-medium">Tenant</th>
                    <th className="hidden border-b border-[#EEE6D8] px-2 py-3 font-medium sm:table-cell">Unit</th>
                    <th className="hidden border-b border-[#EEE6D8] px-2 py-3 font-medium md:table-cell">Next due</th>
                    <th className="border-b border-[#EEE6D8] px-2 py-3 font-medium">Balance</th>
                    <th className="border-b border-[#EEE6D8] px-2 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => {
                    const s = STATUS[statusOf(t)];
                    const isSelected = t.id === selectedId;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => selectTenant(t.id)}
                        className={`cursor-pointer border-b border-[#F3ECDF] last:border-b-0 ${isSelected ? "bg-site-cream" : "hover:bg-site-cream/60"}`}
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectTenant(t.id);
                            }}
                            aria-pressed={isSelected}
                            className={`rounded text-left font-semibold text-site-text ${ring}`}
                          >
                            {t.name}
                          </button>
                          <div className="text-xs text-site-muted sm:hidden">{unitText(t)}</div>
                        </td>
                        <td className="hidden px-2 py-3 sm:table-cell">{unitText(t)}</td>
                        <td className="hidden whitespace-nowrap px-2 py-3 md:table-cell">{t.nextDueDate ? formatDate(t.nextDueDate) : "—"}</td>
                        <td className="whitespace-nowrap px-2 py-3">{formatNairaCompact(t.outstanding)}</td>
                        <td className="px-2 py-3">
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div ref={panelRef} className="min-w-0 flex-[1_1_300px] scroll-mt-24 lg:sticky lg:top-24">
          <TenantPanel tenant={selected} />
        </div>
      </div>

      <section id="by-property" className="scroll-mt-24 pt-10">
        <h2 className="m-0 font-display text-2xl font-bold">Browse by property</h2>
        <p className="m-0 mt-1 text-sm text-site-muted">Open a property to register a new tenant, export its tenant list, or send login links.</p>

        {properties && properties.length === 0 && (
          <div className="mt-4">
            <EmptyState icon={FaBuilding} title="No properties yet" body="Add a property first, then come back here to manage its tenants." />
          </div>
        )}

        {properties && properties.length > 0 && filteredProperties.length === 0 && (
          <div className="mt-4">
            <EmptyState icon={FaSearch} title="No properties match your search" />
          </div>
        )}

        {filteredProperties.length > 0 && (
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
            {filteredProperties.map((p) => (
              <PropertySelectorCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
