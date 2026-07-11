import { useEffect, useState } from "react";
import { FaPlus, FaTools } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import FormField from "../../../components/FormField";
import { TENANT_NAV } from "../../../config/navigation";
import { maintenanceApi } from "../../../api/maintenance";

const STATUS_TONE = { PENDING: "amber", IN_PROGRESS: "brand", COMPLETED: "green" };
const STATUS_LABEL = { PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed" };

function RequestForm({ onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ title: "", description: "" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField label="What needs fixing?" name="title" placeholder="e.g. Leaking Tap" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Details</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          required
          placeholder="Describe the issue…"
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </form>
  );
}

export default function TenantMaintenance() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    maintenanceApi
      .listOwn()
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      await maintenanceApi.create(form);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell navItems={TENANT_NAV} title="Maintenance Requests" subtitle="Report an issue with your room or track a previous request">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          <FaPlus size={12} /> New Request
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {requests && requests.length === 0 && (
        <EmptyState icon={FaTools} title="No requests yet" body="Submit a maintenance request and your landlord or secretary will be notified." />
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink-900">{r.title}</div>
                  <div className="text-xs text-ink-400">{formatDate(r.createdAt)}</div>
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-700">{r.description}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} title="Submit a Maintenance Request" onClose={() => setShowModal(false)}>
        <RequestForm onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} error={formError} />
      </Modal>
    </DashboardShell>
  );
}
