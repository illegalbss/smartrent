import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaPlus, FaBuilding, FaEdit, FaTrash } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatNaira, formatNairaCompact } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { propertiesApi } from "../../../api/properties";

function PropertyThumb({ property }) {
  const icon = (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
      <FaBuilding size={18} />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return (
    <div className="h-11 w-11 overflow-hidden rounded-xl bg-brand-50">
      <AuthImage
        src={propertiesApi.photoUrl(property.id)}
        alt={property.name}
        className="h-full w-full object-cover"
        fallback={icon}
      />
    </div>
  );
}

function PropertyForm({ initial, onSubmit, onCancel, submitting, error }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || { name: "", address: "", ownershipType: "PERSONAL", propertyType: "RESIDENTIAL" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField
        label={form.propertyType === "COMMERCIAL" ? "Store Name" : "Property Name"}
        name="name"
        placeholder={form.propertyType === "COMMERCIAL" ? "e.g. Lekki Plaza" : "e.g. Sunrise Apartments"}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <FormField
        label="Address"
        name="address"
        placeholder="e.g. 12 Palm Street, Lagos"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        required
      />
      {!isEdit && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Property Type</label>
          <div className="grid grid-cols-2 gap-2.5">
            {["RESIDENTIAL", "COMMERCIAL"].map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setForm((f) => ({ ...f, propertyType: type }))}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                  form.propertyType === type
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-500 hover:border-brand-300"
                }`}
              >
                {type === "RESIDENTIAL" ? "Residential" : "Commercial (Store)"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            {form.propertyType === "COMMERCIAL"
              ? "Units are rented to Shop Owners with business details instead of tenants."
              : "Rooms are rented to residential tenants."}
          </p>
        </div>
      )}
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Ownership Type</label>
        <div className="grid grid-cols-2 gap-2.5">
          {["PERSONAL", "ORGANIZATION"].map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setForm((f) => ({ ...f, ownershipType: type }))}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                form.ownershipType === type
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-500 hover:border-brand-300"
              }`}
            >
              {type === "PERSONAL" ? "Personal" : "Organization"}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// Unit-map tile colours (design spec): maroon = paid / up to date,
// red = owing or nothing paid yet, gold = part-paid, dashed = vacant.
const TILE = {
  PAID: { cls: "bg-brand-700 text-white", label: "paid or up to date" },
  OWING: { cls: "bg-[#8A1C1C] text-white", label: "owing" },
  PARTIAL: { cls: "bg-gold-500 text-site-text", label: "part-paid" },
  VACANT: { cls: "border-[1.5px] border-dashed border-[#B8AE9C] bg-[#EEEAE3] text-[#4A443D]", label: "vacant" },
};
const UNIT_CHIP = {
  PAID: { tone: "green", label: "Up to date" },
  OWING: { tone: "red", label: "Owing" },
  PARTIAL: { tone: "amber", label: "Part-paid" },
  VACANT: { tone: "ink", label: "Vacant" },
};
const FREQ_SHORT = { MONTHLY: "mo", QUARTERLY: "qtr", YEARLY: "yr" };

// Each room's state, from the property's own detail data.
function unitStates(detail) {
  const arrearsByRoom = new Map((detail.stats?.tenantsInArrears || []).map((t) => [t.room, t.lastPaymentStatus]));
  return detail.rooms.map((room) => {
    let state = "VACANT";
    if (room.status === "OCCUPIED") {
      const arrears = arrearsByRoom.get(room.roomNumber);
      state = !arrears ? "PAID" : arrears === "PARTIAL" ? "PARTIAL" : "OWING";
    }
    return { ...room, state, tenant: room.tenants?.[0] || null };
  });
}

function UnitMap({ units, unitWord }) {
  if (units.length === 0) return <p className="mt-4 text-sm text-site-muted">No {unitWord}s added yet.</p>;
  const counts = Object.keys(TILE)
    .map((k) => [k, units.filter((u) => u.state === k).length])
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${TILE[k].label}`)
    .join(", ");
  return (
    <div className="mt-[18px] grid grid-cols-5 gap-2" role="img" aria-label={`Unit map: ${counts}`}>
      {units.map((u) => (
        <div
          key={u.id}
          title={`${u.roomNumber}: ${TILE[u.state].label}`}
          className={`flex h-10 items-center justify-center truncate rounded-lg px-1 text-xs font-semibold ${TILE[u.state].cls}`}
        >
          {u.roomNumber}
        </div>
      ))}
    </div>
  );
}

export default function Properties() {
  const [properties, setProperties] = useState(null);
  const [details, setDetails] = useState({}); // propertyId -> property detail (rooms + stats)
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add" | "edit", property }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    propertiesApi
      .list()
      .then((res) => {
        setProperties(res.data);
        setSelectedId((current) => (res.data.some((p) => p.id === current) ? current : res.data[0]?.id || null));
        // Per-property detail powers the unit maps and units table.
        Promise.all(res.data.map((p) => propertiesApi.get(p.id).then((r) => [p.id, r.data]).catch(() => [p.id, null]))).then((pairs) =>
          setDetails(Object.fromEntries(pairs))
        );
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  // The dashboard's "Add Property" button links here with ?add=1.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setModal({ mode: "add" });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function handleSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      if (modal.mode === "add") {
        await propertiesApi.create(form);
      } else {
        await propertiesApi.update(modal.property.id, form);
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await propertiesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  const totalUnits = properties?.reduce((sum, p) => sum + p.totalRooms, 0) || 0;
  const selected = properties?.find((p) => p.id === selectedId) || null;
  const selectedUnits = selected && details[selected.id] ? unitStates(details[selected.id]) : null;
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title="Properties"
      subtitle={properties ? `${properties.length} propert${properties.length === 1 ? "y" : "ies"} · ${totalUnits} units` : "Your buildings and units"}
    >
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setModal({ mode: "add" })}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gold-500 px-5 font-bold text-site-text transition motion-safe:hover:-translate-y-0.5 ${ring}`}
        >
          <FaPlus size={12} aria-hidden="true" /> Add property
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

      {properties && properties.length === 0 && (
        <EmptyState
          icon={FaBuilding}
          title="No properties yet"
          body="Add your first property to start tracking rooms, tenants, and payments."
          action={
            <button onClick={() => setModal({ mode: "add" })} className={`min-h-[44px] rounded-xl bg-gold-500 px-5 font-bold text-site-text ${ring}`}>
              Add property
            </button>
          }
        />
      )}

      {properties && properties.length > 0 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] gap-4">
            {properties.map((p) => {
              const unitWord = p.propertyType === "COMMERCIAL" ? "unit" : "room";
              const fullyLet = p.totalRooms > 0 && p.occupiedRooms === p.totalRooms;
              const detail = details[p.id];
              return (
                <div
                  key={p.id}
                  className="flex flex-col rounded-[18px] border border-[#EFE6D6] bg-white p-6 transition-[transform,box-shadow] duration-[250ms] hover:shadow-[0_12px_28px_rgba(60,10,10,0.14)] motion-safe:hover:-translate-y-1"
                >
                  <Link to={`/dashboard/staff/properties/${p.id}`} className={`block rounded-lg ${ring}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <PropertyThumb property={p} />
                        <div className="min-w-0">
                          <h3 className="m-0 font-display text-[22px] font-bold leading-tight text-site-text">{p.name}</h3>
                          <p className="m-0 mt-0.5 text-sm text-site-muted">
                            {p.propertyType === "COMMERCIAL" ? "Shops" : "Flats"} · {p.totalRooms} {unitWord}
                            {p.totalRooms === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <Badge tone={fullyLet ? "green" : "amber"}>
                        {p.occupiedRooms} of {p.totalRooms} let
                      </Badge>
                    </div>
                    <p className="m-0 mt-2 line-clamp-2 text-[13px] text-site-muted">{p.address}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.propertyType === "COMMERCIAL" && <Badge tone="amber">Store</Badge>}
                      <Badge tone={p.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
                        {p.ownershipType === "ORGANIZATION" ? "Organization" : "Personal"}
                      </Badge>
                    </div>

                    {detail ? (
                      <UnitMap units={unitStates(detail)} unitWord={unitWord} />
                    ) : (
                      <div className="mt-[18px] h-10 animate-pulse rounded-lg bg-site-cream motion-reduce:animate-none" aria-hidden="true" />
                    )}

                    <div className="mt-[18px] flex justify-between border-t border-[#F3ECDF] pt-3.5 text-sm">
                      <span className="text-site-muted">Received this month</span>
                      <b>{formatNaira(p.monthlyIncome)}</b>
                    </div>
                  </Link>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setModal({ mode: "edit", property: p })}
                      className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-site-border text-sm font-semibold text-site-text hover:bg-site-cream ${ring}`}
                    >
                      <FaEdit size={12} aria-hidden="true" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#F2C9C9] text-sm font-semibold text-[#8A1C1C] hover:bg-[#FBE6E6] ${ring}`}
                    >
                      <FaTrash size={12} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-site-muted">
            <span>Maroon: paid or up to date</span>
            <span>Red: owing or not yet paid</span>
            <span>Gold: part-paid</span>
            <span>Dashed: vacant</span>
          </p>

          {selected && (
            <div className="mt-4 rounded-[18px] border border-[#EFE6D6] bg-white px-5 pb-4 pt-2 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <h2 className="m-0 font-display text-xl font-bold">Units in {selected.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  {properties.length > 1 && (
                    <label className="flex items-center gap-2 text-sm text-site-muted">
                      <span className="sr-only sm:not-sr-only">Show</span>
                      <select
                        value={selected.id}
                        onChange={(e) => setSelectedId(e.target.value)}
                        className={`min-h-[44px] rounded-xl border border-site-border bg-white px-3 text-sm font-semibold text-site-text ${ring}`}
                      >
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <Link to={`/dashboard/staff/properties/${selected.id}`} className={`text-sm font-semibold text-brand-700 hover:underline ${ring}`}>
                    Add or edit units
                  </Link>
                </div>
              </div>
              {!selectedUnits ? (
                <p className="pb-3 text-sm text-site-muted">Loading units…</p>
              ) : selectedUnits.length === 0 ? (
                <p className="pb-3 text-sm text-site-muted">No units yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[13px] text-site-muted">
                        <th className="border-b border-[#EEE6D8] py-2 font-medium">Unit</th>
                        <th className="border-b border-[#EEE6D8] py-2 font-medium">Rent</th>
                        <th className="border-b border-[#EEE6D8] py-2 font-medium">Tenant</th>
                        <th className="border-b border-[#EEE6D8] py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUnits.map((u) => (
                        <tr key={u.id} className="border-b border-[#F3ECDF] last:border-b-0">
                          <td className="py-3 pr-2 font-semibold">{u.roomNumber}</td>
                          <td className="whitespace-nowrap py-3 pr-2">
                            {/* Short amount on phones so the Status column stays on screen. */}
                            <span className="sm:hidden">{formatNairaCompact(u.rentAmount)}</span>
                            <span className="hidden sm:inline">{formatNaira(u.rentAmount)}</span>
                            <span className="text-site-muted"> / {FREQ_SHORT[u.rentFrequency] || "yr"}</span>
                          </td>
                          <td className="py-3 pr-2">
                            {u.tenant ? (
                              <Link to={`/dashboard/staff/tenants/${u.tenant.id}`} className={`font-medium hover:text-brand-700 hover:underline ${ring}`}>
                                {u.tenant.name}
                              </Link>
                            ) : (
                              <span className="text-site-muted">No tenant</span>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge tone={UNIT_CHIP[u.state].tone}>{UNIT_CHIP[u.state].label}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal open={!!modal} title={modal?.mode === "add" ? "Add Property" : "Edit Property"} onClose={() => setModal(null)}>
        {modal && (
          <PropertyForm
            initial={modal.mode === "edit" ? modal.property : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            submitting={submitting}
            error={formError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this property?"
        body={`This will permanently delete "${deleteTarget?.name}". Properties with occupied rooms cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
