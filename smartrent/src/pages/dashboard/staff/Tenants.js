import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBuilding, FaArrowRight, FaSearch } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatNairaCompact, formatNaira } from "../../../components/dashboard/UiKit";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { propertiesApi } from "../../../api/properties";

function PropertyThumb({ property }) {
  const icon = (
    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-300">
      <FaBuilding size={28} />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return <AuthImage src={propertiesApi.photoUrl(property.id)} alt={property.name} className="h-full w-full object-cover" fallback={icon} />;
}

function PropertySelectorCard({ property }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="h-36 overflow-hidden bg-ink-50">
        <PropertyThumb property={property} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-ink-900">{property.name}</h3>
          <Badge tone="green">Active</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-ink-400">{property.address}</p>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-sm font-extrabold text-ink-900">{property.totalRooms}</div>
            <div className="text-[10px] font-semibold uppercase text-ink-400">Rooms</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-green-600">{property.occupiedRooms}</div>
            <div className="text-[10px] font-semibold uppercase text-ink-400">Occupied</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-amber-600">{property.vacantRooms}</div>
            <div className="text-[10px] font-semibold uppercase text-ink-400">Vacant</div>
          </div>
          <div>
            <div className="text-sm font-extrabold text-ink-900">{property.tenantCount}</div>
            <div className="text-[10px] font-semibold uppercase text-ink-400">Tenants</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5 text-sm">
          <div>
            <div className="text-[10px] font-semibold uppercase text-ink-400">Monthly Income</div>
            <div className="font-bold text-green-600" title={formatNaira(property.monthlyIncome)}>
              {formatNairaCompact(property.monthlyIncome)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase text-ink-400">Outstanding</div>
            <div className={`font-bold ${property.outstanding > 0 ? "text-red-600" : "text-green-600"}`} title={formatNaira(property.outstanding)}>
              {formatNairaCompact(property.outstanding)}
            </div>
          </div>
        </div>

        <Link
          to={`/dashboard/staff/properties/${property.id}/tenants`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          View Tenants <FaArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export default function Tenants() {
  const [properties, setProperties] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    propertiesApi
      .list()
      .then((res) => setProperties(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const filtered =
    properties?.filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    }) || [];

  return (
    <DashboardShell navItems={STAFF_NAV} title="Tenants" subtitle="Choose a property to view and manage its tenants">
      <div className="mb-5">
        <div className="relative max-w-sm">
          <FaSearch size={13} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties…"
            className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2.5 pl-10 pr-3.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {properties && properties.length === 0 && (
        <EmptyState icon={FaBuilding} title="No properties yet" body="Add a property first, then come back here to manage its tenants." />
      )}

      {properties && properties.length > 0 && filtered.length === 0 && (
        <EmptyState icon={FaSearch} title="No properties match your search" />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <PropertySelectorCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
