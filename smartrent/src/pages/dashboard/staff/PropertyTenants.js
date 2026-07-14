import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaChevronRight,
  FaPlus,
  FaTrash,
  FaSearch,
  FaFileExport,
  FaEllipsisV,
  FaBuilding,
  FaUsers,
  FaDoorOpen,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, Avatar, ConfirmMenu, formatDate, formatNaira, formatNairaCompact } from "../../../components/dashboard/UiKit";
import AuthImage from "../../../components/AuthImage";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { propertiesApi } from "../../../api/properties";
import { tenantsApi } from "../../../api/tenants";

const PAYMENT_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red", NO_PAYMENTS: "ink" };
const PAYMENT_LABEL = { PAID: "Paid", PARTIAL: "Partial", OWING: "Outstanding", NO_PAYMENTS: "No Payments" };
const FREQUENCY_SHORT = { MONTHLY: "mo", QUARTERLY: "qtr", YEARLY: "yr" };

function leaseState(tenant) {
  if (!tenant.dateExpiration) return "NONE";
  const days = Math.ceil((new Date(tenant.dateExpiration).getTime() - Date.now()) / 86400000);
  if (days < 0) return "EXPIRED";
  if (days <= 60) return "EXPIRING";
  return "ACTIVE";
}

function PropertyThumb({ property }) {
  const icon = (
    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-300">
      <FaBuilding size={20} />
    </div>
  );
  if (!property.hasPhoto) return icon;
  return <AuthImage src={propertiesApi.photoUrl(property.id)} alt={property.name} className="h-full w-full object-cover" fallback={icon} />;
}

function RegisterTenantForm({ property, rooms, onSubmit, onCancel, submitting, error }) {
  const isCommercial = property.propertyType === "COMMERCIAL";
  const occupantWord = isCommercial ? "Shop Owner" : "Tenant";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    roomId: "",
    dateCommencement: "",
    dateExpiration: "",
    dateRenewal: "",
    businessName: "",
    cacNumber: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
  });
  const [inviteLink, setInviteLink] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      roomId: form.roomId || undefined,
      dateCommencement: form.dateCommencement || undefined,
      dateExpiration: form.dateExpiration || undefined,
      dateRenewal: form.dateRenewal || undefined,
      ...(isCommercial
        ? { businessName: form.businessName || undefined, cacNumber: form.cacNumber || undefined }
        : { nextOfKinName: form.nextOfKinName || undefined, nextOfKinPhone: form.nextOfKinPhone || undefined }),
    };
    const result = await onSubmit(payload);
    if (result?.inviteToken) {
      setInviteLink(`${window.location.origin}/accept-invite?token=${result.inviteToken}&role=tenant`);
    }
  }

  if (inviteLink) {
    return (
      <div>
        <p className="text-sm text-ink-600">{occupantWord} registered. Share this activation link with them to set up their login:</p>
        <div className="mt-3 break-all rounded-lg bg-ink-50 px-3.5 py-2.5 text-xs font-mono text-ink-700">{inviteLink}</div>
        <button
          onClick={() => navigator.clipboard?.writeText(inviteLink)}
          className="mt-3 w-full rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"
        >
          Copy Link
        </button>
        <button onClick={onCancel} className="mt-2.5 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-600">Registering into {property.name}</p>
      <FormField label={`${occupantWord}'s Name`} name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <FormField label="Email Address" name="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
      <FormField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

      {isCommercial && (
        <>
          <FormField label="Business Name" name="businessName" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
          <FormField label="CAC Registration Number (optional)" name="cacNumber" value={form.cacNumber} onChange={(e) => setForm((f) => ({ ...f, cacNumber: e.target.value }))} />
        </>
      )}

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">{isCommercial ? "Unit / Shop" : "Room / Apartment"}</label>
        <select
          value={form.roomId}
          onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        >
          <option value="">No vacant {isCommercial ? "units" : "rooms"} available</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {isCommercial ? "Unit" : "Room"} {r.roomNumber} — {formatNaira(r.rentAmount)}/{FREQUENCY_SHORT[r.rentFrequency || "YEARLY"]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
        <FormField label="Date Commenced" name="dateCommencement" type="date" value={form.dateCommencement} onChange={(e) => setForm((f) => ({ ...f, dateCommencement: e.target.value }))} />
        <FormField label="Date of Expiration" name="dateExpiration" type="date" value={form.dateExpiration} onChange={(e) => setForm((f) => ({ ...f, dateExpiration: e.target.value }))} />
        <FormField label="Renewal Date" name="dateRenewal" type="date" value={form.dateRenewal} onChange={(e) => setForm((f) => ({ ...f, dateRenewal: e.target.value }))} />
      </div>

      {!isCommercial && (
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          <FormField label="Next of Kin Name (optional)" name="nextOfKinName" value={form.nextOfKinName} onChange={(e) => setForm((f) => ({ ...f, nextOfKinName: e.target.value }))} />
          <FormField label="Next of Kin Phone (optional)" name="nextOfKinPhone" value={form.nextOfKinPhone} onChange={(e) => setForm((f) => ({ ...f, nextOfKinPhone: e.target.value }))} />
        </div>
      )}

      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Registering…" : `Register ${occupantWord}`}
        </button>
      </div>
    </form>
  );
}

const PAGE_SIZE = 8;

export default function PropertyTenants() {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [tenants, setTenants] = useState(null);
  const [vacantRooms, setVacantRooms] = useState([]);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [leaseFilter, setLeaseFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [page, setPage] = useState(1);

  function load() {
    propertiesApi
      .get(propertyId)
      .then((res) => {
        setProperty(res.data);
        setVacantRooms(res.data.rooms.filter((r) => r.status === "VACANT"));
      })
      .catch((err) => setError(err.message));
    tenantsApi
      .list({ propertyId, limit: 500 })
      .then((res) => setTenants(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [propertyId]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, leaseFilter, paymentFilter, sortBy]);

  const monthlyIncome = property?.stats?.collectedThisMonth || 0;
  const isCommercial = property?.propertyType === "COMMERCIAL";
  const occupantWord = isCommercial ? "Shop Owner" : "Tenant";
  const occupantWordPlural = isCommercial ? "Shop Owners" : "Tenants";
  const roomWordPlural = isCommercial ? "Units" : "Rooms";

  const filteredSorted = useMemo(() => {
    if (!tenants) return [];
    const q = search.trim().toLowerCase();
    let list = tenants.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q) && !(t.room?.roomNumber || "").toLowerCase().includes(q)) return false;
      if (statusFilter === "ACTIVE" && !t.inviteAcceptedAt) return false;
      if (statusFilter === "PENDING" && t.inviteAcceptedAt) return false;
      if (leaseFilter !== "ALL" && leaseState(t) !== leaseFilter) return false;
      if (paymentFilter !== "ALL" && (t.lastPaymentStatus || "NO_PAYMENTS") !== paymentFilter) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "NAME") return a.name.localeCompare(b.name);
      if (sortBy === "OUTSTANDING") return (b.outstanding || 0) - (a.outstanding || 0);
      if (sortBy === "NEXT_DUE") return new Date(a.nextDueDate || "9999-12-31") - new Date(b.nextDueDate || "9999-12-31");
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return list;
  }, [tenants, search, statusFilter, leaseFilter, paymentFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const pageItems = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleRegister(payload) {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await tenantsApi.register(payload);
      load();
      return res.data;
    } catch (err) {
      setFormError(err.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await tenantsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleExport() {
    const headers = ["Name", "Email", "Room", "Phone", "Payment Status", "Outstanding", "Next Payment Due", "Lease Ends"];
    const rows = filteredSorted.map((t) => [
      t.name,
      t.email,
      t.room?.roomNumber || "",
      t.phone || "",
      PAYMENT_LABEL[t.lastPaymentStatus || "NO_PAYMENTS"],
      t.outstanding,
      t.nextDueDate ? formatDate(t.nextDueDate) : "",
      t.dateExpiration ? formatDate(t.dateExpiration) : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${property?.name || "tenants"}-tenants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title={property ? `${occupantWordPlural} — ${property.name}` : "Tenants"} subtitle={`${occupantWordPlural} for this property only`}>
      <nav className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-ink-400">
        <Link to="/dashboard/staff" className="hover:text-brand-600">Dashboard</Link>
        <FaChevronRight size={9} />
        <Link to="/dashboard/staff/properties" className="hover:text-brand-600">Properties</Link>
        <FaChevronRight size={9} />
        <Link to={`/dashboard/staff/properties/${propertyId}`} className="hover:text-brand-600">{property?.name || "…"}</Link>
        <FaChevronRight size={9} />
        <span className="text-ink-700">{occupantWordPlural}</span>
      </nav>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {property && (
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
              <PropertyThumb property={property} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-ink-900">{property.name}</h2>
                <Badge tone="green">Active</Badge>
              </div>
              <p className="text-xs text-ink-400">{property.address}</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs font-semibold text-ink-500">
                <span className="flex items-center gap-1"><FaDoorOpen size={11} /> {property.stats.totalRooms} {roomWordPlural}</span>
                <span className="flex items-center gap-1"><FaBuilding size={11} /> {property.stats.occupiedRooms} Occupied</span>
                <span className="flex items-center gap-1"><FaDoorOpen size={11} /> {property.stats.vacantRooms} Vacant</span>
                <span className="flex items-center gap-1"><FaUsers size={11} /> {property.stats.tenantCount} {occupantWordPlural}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold uppercase text-ink-400">Collected This Month</div>
              <div className="truncate text-base font-extrabold text-green-600" title={formatNaira(monthlyIncome)}>{formatNairaCompact(monthlyIncome)}</div>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold uppercase text-ink-400">Outstanding</div>
              <div className="truncate text-base font-extrabold text-red-600" title={formatNaira(property.stats.totalOwing)}>{formatNairaCompact(property.stats.totalOwing)}</div>
            </div>
            <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-800">
              <FaFileExport size={12} /> Export
            </button>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <FaSearch size={13} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${occupantWordPlural.toLowerCase()}…`}
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500">
            <option value="ALL">All Payment Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="OWING">Outstanding</option>
            <option value="NO_PAYMENTS">No Payments</option>
          </select>
          <select value={leaseFilter} onChange={(e) => setLeaseFilter(e.target.value)} className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500">
            <option value="ALL">All Lease Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Lease Ending Soon</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Activated</option>
            <option value="PENDING">Invite Pending</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500">
            <option value="NEWEST">Sort: Newest</option>
            <option value="NAME">Sort: Name</option>
            <option value="OUTSTANDING">Sort: Outstanding</option>
            <option value="NEXT_DUE">Sort: Next Due</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          <FaPlus size={12} /> Add {occupantWord}
        </button>
      </div>

      {tenants && filteredSorted.length === 0 && (
        <EmptyState icon={FaUsers} title={`No ${occupantWordPlural.toLowerCase()} match`} body={`Try a different search or filter, or register a new ${occupantWord.toLowerCase()} into this property.`} />
      )}

      {pageItems.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-bold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">{occupantWord}</th>
                <th className="px-4 py-3">{isCommercial ? "Unit Number" : "Room Number"}</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Next Payment Due</th>
                <th className="px-4 py-3">Lease Ends</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {pageItems.map((t) => {
                const status = t.lastPaymentStatus || "NO_PAYMENTS";
                const lease = leaseState(t);
                return (
                  <tr key={t.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar entity={t} photoSrc={tenantsApi.photoUrl(t.id)} size="h-9 w-9 text-xs" />
                        <div>
                          <Link to={`/dashboard/staff/tenants/${t.id}`} className="font-semibold text-ink-800 hover:text-brand-600">{t.name}</Link>
                          <div className="text-xs text-ink-400">{t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{t.room?.roomNumber || "—"}</td>
                    <td className="px-4 py-3 text-ink-700">{t.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PAYMENT_TONE[status]}>{PAYMENT_LABEL[status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${t.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>{formatNaira(t.outstanding)}</span>
                      {t.isOverdue && <div className="text-xs text-red-500">(Overdue)</div>}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{t.nextDueDate ? formatDate(t.nextDueDate) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={lease === "EXPIRED" ? "text-red-600 font-semibold" : lease === "EXPIRING" ? "text-amber-600 font-semibold" : "text-ink-700"}>
                        {t.dateExpiration ? formatDate(t.dateExpiration) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/dashboard/staff/tenants/${t.id}`} className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:border-brand-300 hover:text-brand-600">
                          View Profile
                        </Link>
                        <div className="relative">
                          <button onClick={() => setMenuOpenId(menuOpenId === t.id ? null : t.id)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
                            <FaEllipsisV size={13} />
                          </button>
                          {menuOpenId === t.id && (
                            <ConfirmMenu onClose={() => setMenuOpenId(null)}>
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setDeleteTarget(t);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                              >
                                <FaTrash size={12} /> Delete Tenant
                              </button>
                            </ConfirmMenu>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-4 py-3.5 sm:flex-row">
            <p className="text-xs text-ink-400">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filteredSorted.length)} of {filteredSorted.length} tenants
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:bg-ink-50 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 text-xs font-bold text-ink-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:bg-ink-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={showModal} title="Register New Tenant" onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        {property && (
          <RegisterTenantForm
            property={property}
            rooms={vacantRooms}
            onSubmit={handleRegister}
            onCancel={() => setShowModal(false)}
            submitting={submitting}
            error={formError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this tenant?"
        body={`This permanently removes "${deleteTarget?.name}" — use this to correct a registration mistake. Tenants with payment or document history can't be deleted; offboard them instead.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
