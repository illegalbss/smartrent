import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaUsers, FaTrash, FaSearch, FaTh, FaList } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, Avatar, EmptyState, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { tenantsApi } from "../../../api/tenants";
import { propertiesApi, roomsApi } from "../../../api/properties";

function RegisterTenantForm({ onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    roomId: "",
    dateCommencement: "",
    dateExpiration: "",
    dateRenewal: "",
  });
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    propertiesApi.list().then((res) => setProperties(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.propertyId) {
      setRooms([]);
      return;
    }
    roomsApi
      .list(form.propertyId)
      .then((res) => setRooms(res.data.filter((r) => r.status === "VACANT")))
      .catch(() => {});
  }, [form.propertyId]);

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
    };
    const result = await onSubmit(payload);
    if (result?.inviteToken) {
      setInviteLink(`${window.location.origin}/accept-invite?token=${result.inviteToken}&role=tenant`);
    }
  }

  if (inviteLink) {
    return (
      <div>
        <p className="text-sm text-ink-600">
          Tenant registered. Share this activation link with them to set up their login:
        </p>
        <div className="mt-3 break-all rounded-lg bg-ink-50 px-3.5 py-2.5 text-xs font-mono text-ink-700">
          {inviteLink}
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(inviteLink);
          }}
          className="mt-3 w-full rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50"
        >
          Copy Link
        </button>
        <button
          onClick={onCancel}
          className="mt-2.5 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Tenant's Name"
        name="name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
      />
      <FormField
        label="Email Address"
        name="email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        required
      />
      <FormField
        label="Phone Number"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Property</label>
        <select
          value={form.propertyId}
          onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value, roomId: "" }))}
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Select a property (optional for now)</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {form.propertyId && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Room / Apartment</label>
          <select
            value={form.roomId}
            onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          >
            <option value="">No vacant rooms available</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} — {formatNaira(r.rentAmount)}/yr
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
        <FormField
          label="Date Commenced"
          name="dateCommencement"
          type="date"
          value={form.dateCommencement}
          onChange={(e) => setForm((f) => ({ ...f, dateCommencement: e.target.value }))}
        />
        <FormField
          label="Date of Expiration"
          name="dateExpiration"
          type="date"
          value={form.dateExpiration}
          onChange={(e) => setForm((f) => ({ ...f, dateExpiration: e.target.value }))}
        />
        <FormField
          label="Renewal Date"
          name="dateRenewal"
          type="date"
          value={form.dateRenewal}
          onChange={(e) => setForm((f) => ({ ...f, dateRenewal: e.target.value }))}
        />
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
          {submitting ? "Registering…" : "Register Tenant"}
        </button>
      </div>
    </form>
  );
}

const PAYMENT_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red" };

function TenantCard({ tenant, onDelete }) {
  return (
    <Card className="relative flex flex-col">
      <Link to={`/dashboard/staff/tenants/${tenant.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <Avatar entity={tenant} photoSrc={tenantsApi.photoUrl(tenant.id)} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-ink-900">{tenant.name}</h3>
            <p className="truncate text-xs text-ink-400">{tenant.email}</p>
            {!tenant.inviteAcceptedAt && (
              <div className="mt-1">
                <Badge tone="amber">Invite Pending</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-semibold uppercase text-ink-400">Room</div>
            {tenant.room ? (
              <>
                <div className="mt-0.5 text-sm font-semibold text-ink-800">{tenant.room.roomNumber}</div>
                <div className="truncate text-xs text-ink-400">{tenant.room.propertyName}</div>
              </>
            ) : (
              <div className="mt-0.5 text-sm text-ink-400">Unassigned</div>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-ink-400">Phone</div>
            <div className="mt-0.5 text-sm font-semibold text-ink-800">{tenant.phone || "—"}</div>
          </div>
        </div>

        <div className="mt-4 flex-1 rounded-lg bg-ink-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-400">Last Payment</span>
            {tenant.lastPaymentStatus && <Badge tone={PAYMENT_TONE[tenant.lastPaymentStatus]}>{tenant.lastPaymentStatus}</Badge>}
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-ink-900">
              {tenant.lastPaymentAmount ? formatNaira(tenant.lastPaymentAmount) : "No payments yet"}
            </span>
            {tenant.dateOfLastPayment && <span className="shrink-0 text-xs text-ink-400">{formatDate(tenant.dateOfLastPayment)}</span>}
          </div>
        </div>

        {tenant.room && (
          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2.5">
            <div>
              <span className="text-xs font-semibold uppercase text-ink-400">Outstanding</span>
              <div className={`text-sm font-bold ${tenant.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatNaira(tenant.outstanding)}
              </div>
            </div>
            {tenant.nextDueDate && (
              <Badge tone={tenant.isOverdue ? "red" : tenant.daysUntilDue <= 14 ? "amber" : "ink"}>
                {tenant.isOverdue ? `${Math.abs(tenant.daysUntilDue)}d overdue` : `Due in ${tenant.daysUntilDue}d`}
              </Badge>
            )}
          </div>
        )}
      </Link>

      <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
        <Link
          to={`/dashboard/staff/tenants/${tenant.id}`}
          className="flex-1 rounded-lg border border-ink-200 py-2 text-center text-xs font-bold text-ink-600 hover:bg-ink-50"
        >
          View Details &amp; Payments
        </Link>
        <button
          onClick={() => onDelete(tenant)}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
          title="Delete tenant"
        >
          <FaTrash size={11} />
        </button>
      </div>
    </Card>
  );
}

export default function Tenants() {
  const [tenants, setTenants] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("cards");

  const loadSeq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function load() {
    const seq = ++loadSeq.current;
    tenantsApi
      .list({ search, limit: 100 })
      .then((res) => {
        // A slower, older search request can resolve after a newer one —
        // ignore it so the UI always reflects the most recent query.
        if (seq === loadSeq.current) setTenants(res.data);
      })
      .catch((err) => {
        if (seq === loadSeq.current) setError(err.message);
      });
  }

  useEffect(load, [search]);

  async function handleSubmit(payload) {
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
    setDeleteError("");
    try {
      await tenantsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title="Tenants" subtitle="Register tenants and cross-check their lease and payment status">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <FaSearch size={13} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, phone, email, or room…"
            className="w-full rounded-xl border border-ink-200 bg-ink-50 py-2.5 pl-10 pr-3.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-ink-200 p-1">
            <button
              onClick={() => setView("cards")}
              className={`rounded-lg p-2 transition ${view === "cards" ? "bg-brand-500 text-white" : "text-ink-400 hover:text-ink-700"}`}
              title="Card view"
            >
              <FaTh size={13} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`rounded-lg p-2 transition ${view === "table" ? "bg-brand-500 text-white" : "text-ink-400 hover:text-ink-700"}`}
              title="Table view"
            >
              <FaList size={13} />
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
          >
            <FaPlus size={12} /> Register Tenant
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {tenants && tenants.length === 0 && (
        <EmptyState
          icon={FaUsers}
          title={search ? "No tenants match your search" : "No tenants registered yet"}
          body={search ? "Try a different name, phone number, or room." : "Register your first tenant to start tracking their lease and payments."}
        />
      )}

      {tenants && tenants.length > 0 && view === "cards" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((t) => (
            <TenantCard
              key={t.id}
              tenant={t}
              onDelete={(tenant) => {
                setDeleteError("");
                setDeleteTarget(tenant);
              }}
            />
          ))}
        </div>
      )}

      {tenants && tenants.length > 0 && view === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs font-bold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">S/N</th>
                <th className="px-4 py-3">Tenant's Name</th>
                <th className="px-4 py-3">Apartment/Room No.</th>
                <th className="px-4 py-3">Date Packed In</th>
                <th className="px-4 py-3">Date of Last Payment</th>
                <th className="px-4 py-3">Coverage of Payment</th>
                <th className="px-4 py-3">Outstanding</th>
                <th className="px-4 py-3">Date of Expiration</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tenants.map((t, i) => (
                <tr key={t.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 text-ink-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/staff/tenants/${t.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
                      {t.name}
                    </Link>
                    {!t.inviteAcceptedAt && (
                      <div className="mt-1">
                        <Badge tone="amber">Invite Pending</Badge>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {t.room ? `${t.room.roomNumber} (${t.room.propertyName})` : <span className="text-ink-400">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatDate(t.dateCommencement)}</td>
                  <td className="px-4 py-3 text-ink-700">{formatDate(t.dateOfLastPayment)}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {t.coverageOfPayment ? `${formatDate(t.coverageOfPayment.start)} – ${formatDate(t.coverageOfPayment.end)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {t.room ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${t.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
                          {formatNaira(t.outstanding)}
                        </span>
                        {t.nextDueDate && (
                          <Badge tone={t.isOverdue ? "red" : t.daysUntilDue <= 14 ? "amber" : "ink"}>
                            {t.isOverdue ? `${Math.abs(t.daysUntilDue)}d overdue` : `Due ${t.daysUntilDue}d`}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatDate(t.dateExpiration)}</td>
                  <td className="px-4 py-3 text-ink-700">{t.phone || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setDeleteError("");
                        setDeleteTarget(t);
                      }}
                      className="text-ink-400 hover:text-red-600"
                      title="Delete tenant"
                    >
                      <FaTrash size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} title="Register New Tenant" onClose={() => setShowModal(false)} maxWidth="max-w-xl">
        <RegisterTenantForm onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} error={formError} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this tenant?"
        body={
          deleteError ||
          `This permanently removes "${deleteTarget?.name}" — use this to correct a registration mistake. Tenants with payment or document history can't be deleted; offboard them instead.`
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
      />
    </DashboardShell>
  );
}
