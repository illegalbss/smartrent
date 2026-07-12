import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaDoorOpen,
  FaBuilding,
  FaCamera,
  FaUsers,
  FaCommentDots,
  FaTools,
  FaChevronDown,
  FaCheckCircle,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaChartLine,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, StatCard, EmptyState, Avatar, formatDate, formatNaira, formatNairaCompact } from "../../../components/dashboard/UiKit";
import { IncomeOverviewChart, PaymentStatusChart } from "../../../components/dashboard/FinanceCharts";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { propertiesApi, roomsApi } from "../../../api/properties";
import { tenantsApi } from "../../../api/tenants";

function RoomForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(initial || { roomNumber: "", rentAmount: "" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField
        label="Room / Apartment Number"
        name="roomNumber"
        placeholder="e.g. A1"
        value={form.roomNumber}
        onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))}
        required
      />
      <FormField
        label="Rent Amount (₦ per annum)"
        name="rentAmount"
        type="number"
        placeholder="e.g. 500000"
        value={form.rentAmount}
        onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))}
        required
      />
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

function PropertyEditForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ name: initial.name, address: initial.address, ownershipType: initial.ownershipType });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField label="Property Name" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <FormField label="Address" name="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Ownership Type</label>
        <div className="grid grid-cols-2 gap-2.5">
          {["PERSONAL", "ORGANIZATION"].map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setForm((f) => ({ ...f, ownershipType: type }))}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                form.ownershipType === type ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-500 hover:border-brand-300"
              }`}
            >
              {type === "PERSONAL" ? "Personal" : "Organization"}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 transition hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

const TENANT_STATUS_TONE = { PAID: "green", PARTIAL: "amber", OWING: "red", NO_PAYMENTS: "ink" };
const TENANT_STATUS_LABEL = { PAID: "Paid", PARTIAL: "Partial", OWING: "Owing", NO_PAYMENTS: "No payments yet" };

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [tenants, setTenants] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editPropertyModal, setEditPropertyModal] = useState(false);
  const [deletePropertyConfirm, setDeletePropertyConfirm] = useState(false);
  const settingsRef = useRef(null);

  function load() {
    propertiesApi
      .get(id)
      .then((res) => setProperty(res.data))
      .catch((err) => setError(err.message));
    tenantsApi
      .list({ propertyId: id, limit: 100 })
      .then((res) => setTenants(res.data))
      .catch(() => {});
  }

  useEffect(load, [id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    try {
      await propertiesApi.uploadPhoto(id, file);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      const payload = { roomNumber: form.roomNumber, rentAmount: Number(form.rentAmount) };
      if (modal.mode === "add") {
        await roomsApi.create(id, payload);
      } else {
        await roomsApi.update(modal.room.id, payload);
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
      await roomsApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  async function handleEditProperty(form) {
    setSubmitting(true);
    setFormError("");
    try {
      await propertiesApi.update(id, form);
      setEditPropertyModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProperty() {
    try {
      await propertiesApi.remove(id);
      navigate("/dashboard/staff/properties");
    } catch (err) {
      setError(err.message);
      setDeletePropertyConfirm(false);
    }
  }

  const stats = property?.stats;
  const totalRentExpected = property?.rooms?.reduce((sum, r) => sum + Number(r.rentAmount), 0) || 0;
  const collectionRate =
    stats && stats.totalCollected + stats.totalOwing > 0
      ? Math.round((stats.totalCollected / (stats.totalCollected + stats.totalOwing)) * 1000) / 10
      : 0;

  return (
    <DashboardShell navItems={STAFF_NAV} title={property?.name || "Property"} subtitle={property?.address}>
      <button
        onClick={() => navigate("/dashboard/staff/properties")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600"
      >
        <FaArrowLeft size={12} /> Back to Properties
      </button>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {property && (
        <>
          {/* Header: cover photo + identity */}
          <div className="mb-5 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
            <div className="flex h-48 items-center justify-center sm:h-60">
              {property.hasPhoto ? (
                <AuthImage
                  src={propertiesApi.photoUrl(property.id)}
                  alt={property.name}
                  className="h-full w-full object-cover"
                  fallback={<FaBuilding size={36} className="text-ink-300" />}
                />
              ) : (
                <FaBuilding size={36} className="text-ink-300" />
              )}
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-1.5 border-t border-ink-100 bg-white py-2.5 text-xs font-bold text-ink-600 hover:bg-ink-50">
              <FaCamera size={11} /> {photoUploading ? "Uploading…" : property.hasPhoto ? "Change Photo" : "Upload Property Photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
            </label>
          </div>

          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-ink-900">{property.name}</h2>
                <Badge tone="green">Active Property</Badge>
                <Badge tone={property.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
                  {property.ownershipType === "ORGANIZATION" ? "Organization" : "Personal"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-500">{property.address}</p>
              <p className="mt-1 text-xs font-mono text-ink-400">Property ID: {property.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 shadow-card transition hover:border-brand-300"
              >
                Property Settings <FaChevronDown size={11} />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-ink-100 bg-white py-1.5 shadow-soft">
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setEditPropertyModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    <FaEdit size={12} /> Edit Property
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setDeletePropertyConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <FaTrash size={12} /> Delete Property
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 6 property statistics */}
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total Rooms" value={stats.totalRooms} icon={FaDoorOpen} />
            <StatCard label="Occupied Rooms" value={stats.occupiedRooms} icon={FaCheckCircle} />
            <StatCard label="Vacant Rooms" value={stats.vacantRooms} icon={FaDoorOpen} />
            <StatCard label="Total Tenants" value={stats.tenantCount} icon={FaUsers} />
            <StatCard label="Complaints" value={stats.openComplaints} icon={FaCommentDots} sub={stats.openComplaints > 0 ? "Unresolved" : "All clear"} />
            <StatCard label="Maintenance" value={stats.pendingMaintenance} icon={FaTools} sub={stats.pendingMaintenance > 0 ? "Pending" : "All clear"} />
          </div>

          {/* Financial Overview */}
          <div className="mb-5">
            <h2 className="mb-3 text-sm font-bold text-ink-900">Financial Overview</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Total Rent Expected" value={formatNairaCompact(totalRentExpected)} title={formatNaira(totalRentExpected)} icon={FaMoneyBillWave} sub="per annum" />
              <StatCard label="Rent Collected" value={formatNairaCompact(stats.totalCollected)} title={formatNaira(stats.totalCollected)} icon={FaCheckCircle} />
              <StatCard label="Outstanding Balance" value={formatNairaCompact(stats.totalOwing)} title={formatNaira(stats.totalOwing)} icon={FaExclamationTriangle} />
              <StatCard label="Collected This Month" value={formatNairaCompact(stats.collectedThisMonth)} title={formatNaira(stats.collectedThisMonth)} icon={FaMoneyBillWave} />
              <StatCard label="Collection Rate" value={`${collectionRate}%`} icon={FaChartLine} />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <IncomeOverviewChart series={stats.monthlySeries} />
            <PaymentStatusChart byStatus={stats.byStatus} />
          </div>

          {/* Recent Payments */}
          <Card title="Recent Payments" className="mb-5">
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-ink-400">No payments recorded yet for this property.</p>
            ) : (
              <div className="space-y-1">
                {stats.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-ink-50">
                    <div className="flex items-center gap-3">
                      <Avatar entity={{ name: p.tenantName, hasPhoto: p.tenantHasPhoto }} photoSrc={tenantsApi.photoUrl(p.tenantId)} size="h-9 w-9 text-xs" />
                      <div>
                        <div className="text-sm font-semibold text-ink-800">{p.tenantName}</div>
                        <div className="text-xs text-ink-400">{formatDate(p.datePaid)} · {p.source === "PAYSTACK" ? "Paystack" : "Manual"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">{formatNaira(p.amount)}</span>
                      {p.status === "PAID" && <FaCheckCircle className="text-green-500" size={14} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tenant table */}
          <Card
            title={`Tenants in ${property.name}`}
            action={
              <Link to="/dashboard/staff/tenants" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                View All Tenants
              </Link>
            }
            className="mb-5"
          >
            {!tenants || tenants.length === 0 ? (
              <p className="text-sm text-ink-400">No tenants assigned to this property yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-ink-100 text-xs font-bold uppercase text-ink-400">
                    <tr>
                      <th className="py-2 pr-4">Tenant</th>
                      <th className="py-2 pr-4">Room</th>
                      <th className="py-2 pr-4">Phone</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Next Due Date</th>
                      <th className="py-2 pr-4">Outstanding</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {tenants.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar entity={t} photoSrc={tenantsApi.photoUrl(t.id)} size="h-8 w-8 text-xs" />
                            <span className="font-semibold text-ink-800">{t.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-700">{t.room?.roomNumber || "—"}</td>
                        <td className="py-2.5 pr-4 text-ink-700">{t.phone || "—"}</td>
                        <td className="py-2.5 pr-4">
                          <Badge tone={TENANT_STATUS_TONE[t.lastPaymentStatus || "NO_PAYMENTS"]}>
                            {TENANT_STATUS_LABEL[t.lastPaymentStatus || "NO_PAYMENTS"]}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-700">{t.nextDueDate ? formatDate(t.nextDueDate) : "—"}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`font-semibold ${t.outstanding > 0 ? "text-red-600" : "text-green-600"}`}>{formatNaira(t.outstanding)}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          <Link
                            to={`/dashboard/staff/tenants/${t.id}`}
                            className="inline-block rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:border-brand-300 hover:text-brand-600"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent Complaints */}
          <Card title="Recent Complaints" className="mb-5">
            {stats.recentComplaints.length === 0 ? (
              <p className="text-sm text-ink-400">No complaints raised for this property.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-ink-100 text-xs font-bold uppercase text-ink-400">
                    <tr>
                      <th className="py-2 pr-4">Complaint</th>
                      <th className="py-2 pr-4">Tenant</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {stats.recentComplaints.map((c) => (
                      <tr key={c.id}>
                        <td className="max-w-xs truncate py-2.5 pr-4 text-ink-700">{c.message}</td>
                        <td className="py-2.5 pr-4 font-semibold text-ink-800">{c.tenantName}</td>
                        <td className="py-2.5 pr-4">
                          <Badge tone={c.status === "OPEN" ? "amber" : "green"}>{c.status === "OPEN" ? "Open" : "Resolved"}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-500">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Rooms management */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Rooms</h2>
            <button
              onClick={() => setModal({ mode: "add" })}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
            >
              <FaPlus size={12} /> Add Room
            </button>
          </div>

          {property.rooms.length === 0 && (
            <EmptyState
              icon={FaDoorOpen}
              title="No rooms yet"
              body="Add rooms or apartments to this property to start assigning tenants."
            />
          )}

          {property.rooms.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {property.rooms.map((room) => {
                const tenant = room.tenants?.[0];
                return (
                  <Card key={room.id}>
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-bold text-ink-900">Room {room.roomNumber}</h3>
                      <Badge tone={room.status === "OCCUPIED" ? "green" : "amber"}>
                        {room.status === "OCCUPIED" ? "Occupied" : "Vacant"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-500">{formatNaira(room.rentAmount)} / year</p>
                    {tenant && (
                      <Link
                        to={`/dashboard/staff/tenants/${tenant.id}`}
                        className="mt-3 block rounded-lg bg-ink-50 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {tenant.name}
                      </Link>
                    )}
                    <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
                      <button
                        onClick={() => setModal({ mode: "edit", room })}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50"
                      >
                        <FaEdit size={11} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(room)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        <FaTrash size={11} /> Delete
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={!!modal} title={modal?.mode === "add" ? "Add Room" : "Edit Room"} onClose={() => setModal(null)}>
        {modal && (
          <RoomForm
            initial={modal.mode === "edit" ? { roomNumber: modal.room.roomNumber, rentAmount: modal.room.rentAmount } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            submitting={submitting}
            error={formError}
          />
        )}
      </Modal>

      <Modal open={editPropertyModal} title="Edit Property" onClose={() => setEditPropertyModal(false)}>
        {property && (
          <PropertyEditForm
            initial={property}
            onSubmit={handleEditProperty}
            onCancel={() => setEditPropertyModal(false)}
            submitting={submitting}
            error={formError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this room?"
        body={`This will permanently delete Room ${deleteTarget?.roomNumber}. Occupied rooms cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={deletePropertyConfirm}
        title="Delete this property?"
        body={`This will permanently delete "${property?.name}". Properties with occupied rooms cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteProperty}
        onCancel={() => setDeletePropertyConfirm(false)}
      />
    </DashboardShell>
  );
}
