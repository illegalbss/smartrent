import { useEffect, useState } from "react";
import { FaPlus, FaBullhorn, FaTrash } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { noticesApi } from "../../../api/notices";

function NoticeForm({ onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ title: "", message: "" });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField label="Title" name="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={4}
          required
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Posting…" : "Post Notice"}
        </button>
      </div>
    </form>
  );
}

export default function Notices() {
  const [notices, setNotices] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    noticesApi
      .listForStaff()
      .then((res) => setNotices(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      await noticesApi.create(form);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await noticesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title="Notices" subtitle="Announcements broadcast to every tenant in your portfolio">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          <FaPlus size={12} /> Post Notice
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {notices && notices.length === 0 && (
        <EmptyState icon={FaBullhorn} title="No notices posted yet" body="Post an announcement and every tenant in your portfolio will see it on their dashboard." />
      )}

      {notices && notices.length > 0 && (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink-900">{n.title}</div>
                  <div className="text-xs text-ink-400">{formatDate(n.createdAt)}</div>
                </div>
                <button onClick={() => setDeleteTarget(n)} className="text-ink-400 hover:text-red-600" title="Delete notice">
                  <FaTrash size={13} />
                </button>
              </div>
              <p className="mt-3 text-sm text-ink-700">{n.message}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} title="Post a Notice" onClose={() => setShowModal(false)}>
        <NoticeForm onSubmit={handleSubmit} onCancel={() => setShowModal(false)} submitting={submitting} error={formError} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this notice?"
        body={`"${deleteTarget?.title}" will be removed and tenants will no longer see it.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
