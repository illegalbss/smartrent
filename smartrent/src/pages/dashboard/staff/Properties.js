import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaBuilding, FaChevronRight, FaEdit, FaTrash } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, EmptyState } from "../../../components/dashboard/UiKit";
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
  const [form, setForm] = useState(initial || { name: "", address: "", ownershipType: "PERSONAL" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField
        label="Property Name"
        name="name"
        placeholder="e.g. Sunrise Apartments"
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

export default function Properties() {
  const [properties, setProperties] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode: "add" | "edit", property }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    propertiesApi
      .list()
      .then((res) => setProperties(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

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

  return (
    <DashboardShell navItems={STAFF_NAV} title="Properties" subtitle="Add, edit, or remove properties and correct entry mistakes">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setModal({ mode: "add" })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          <FaPlus size={12} /> Add Property
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {properties && properties.length === 0 && (
        <EmptyState
          icon={FaBuilding}
          title="No properties yet"
          body="Add your first property to start tracking rooms, tenants, and payments."
          action={
            <button
              onClick={() => setModal({ mode: "add" })}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              Add Property
            </button>
          }
        />
      )}

      {properties && properties.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="relative">
              <Link to={`/dashboard/staff/properties/${p.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <PropertyThumb property={p} />
                  <Badge tone={p.ownershipType === "ORGANIZATION" ? "brand" : "ink"}>
                    {p.ownershipType === "ORGANIZATION" ? "Organization" : "Personal"}
                  </Badge>
                </div>
                <h3 className="mt-4 text-base font-bold text-ink-900">{p.name}</h3>
                <p className="mt-1 text-sm text-ink-500">{p.address}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink-500">
                    {p.occupiedRooms}/{p.totalRooms} rooms occupied
                  </span>
                  <FaChevronRight className="text-ink-300" size={13} />
                </div>
              </Link>
              <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
                <button
                  onClick={() => setModal({ mode: "edit", property: p })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 py-2 text-xs font-bold text-ink-600 hover:bg-ink-50"
                >
                  <FaEdit size={11} /> Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <FaTrash size={11} /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
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
