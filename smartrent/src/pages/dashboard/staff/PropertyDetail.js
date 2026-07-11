import { useEffect, useState } from "react";
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
  FaMoneyBillWave,
  FaExclamationTriangle,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, StatCard, EmptyState, formatNaira } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import AuthImage from "../../../components/AuthImage";
import { STAFF_NAV } from "../../../config/navigation";
import { propertiesApi, roomsApi } from "../../../api/properties";

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

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  function load() {
    propertiesApi
      .get(id)
      .then((res) => setProperty(res.data))
      .catch((err) => setError(err.message));
  }

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

  useEffect(load, [id]);

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

  return (
    <DashboardShell
      navItems={STAFF_NAV}
      title={property?.name || "Property"}
      subtitle={property?.address}
    >
      <button
        onClick={() => navigate("/dashboard/staff/properties")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600"
      >
        <FaArrowLeft size={12} /> Back to Properties
      </button>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {property && (
        <>
          <div className="mb-5 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
            <div className="flex h-40 items-center justify-center sm:h-52">
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

          <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Occupancy" value={`${property.stats.occupancyRate}%`} icon={FaDoorOpen} sub={`${property.stats.occupiedRooms}/${property.stats.totalRooms} rooms occupied`} />
            <StatCard label="Tenants" value={property.stats.tenantCount} icon={FaUsers} />
            <StatCard label="Total Collected" value={formatNaira(property.stats.totalCollected)} icon={FaMoneyBillWave} />
            <StatCard label="Outstanding" value={formatNaira(property.stats.totalOwing)} icon={FaExclamationTriangle} />
          </div>

          <div className="mb-5 flex items-center justify-between">
            <Badge tone={property.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
              {property.ownershipType === "ORGANIZATION" ? "Organization-Owned" : "Personally-Owned"}
            </Badge>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this room?"
        body={`This will permanently delete Room ${deleteTarget?.roomNumber}. Occupied rooms cannot be deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
