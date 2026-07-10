import { useEffect, useState } from "react";
import { FaPlus, FaUserTie, FaTrash } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, EmptyState } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { secretariesApi } from "../../../api/secretaries";
import { useAuth } from "../../../context/AuthContext";

function InviteForm({ onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [inviteLink, setInviteLink] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await onSubmit(form);
    if (result?.inviteToken) {
      setInviteLink(`${window.location.origin}/accept-invite?token=${result.inviteToken}&role=secretary`);
    }
  }

  if (inviteLink) {
    return (
      <div>
        <p className="text-sm text-ink-600">Secretary invited. Share this activation link with them:</p>
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
      <FormField label="Full Name" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <FormField label="Email Address" name="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
      <FormField label="Phone Number" name="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Inviting…" : "Send Invite"}
        </button>
      </div>
    </form>
  );
}

export default function Secretaries() {
  const { user } = useAuth();
  const [secretaries, setSecretaries] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    secretariesApi
      .list()
      .then((res) => setSecretaries(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleInvite(form) {
    setSubmitting(true);
    setFormError("");
    try {
      const res = await secretariesApi.invite(form);
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
      await secretariesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  if (user.role !== "landlord") {
    return (
      <DashboardShell navItems={STAFF_NAV} title="Secretaries">
        <EmptyState icon={FaUserTie} title="Landlord access only" body="Only the landlord account can manage secretary access." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title="Secretaries" subtitle="Invite and manage secretary/accountant accounts">
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          <FaPlus size={12} /> Invite Secretary
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {secretaries && secretaries.length === 0 && (
        <EmptyState icon={FaUserTie} title="No secretaries yet" body="Invite a secretary/accountant to help register tenants and manage payments." />
      )}

      {secretaries && secretaries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {secretaries.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-ink-900">{s.name}</div>
                  <div className="text-xs text-ink-500">{s.email}</div>
                  {s.phone && <div className="text-xs text-ink-500">{s.phone}</div>}
                </div>
                <button onClick={() => setDeleteTarget(s)} className="text-ink-400 hover:text-red-600">
                  <FaTrash size={13} />
                </button>
              </div>
              <div className="mt-3 text-xs font-semibold">
                {s.inviteAcceptedAt ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-amber-600">Invite Pending</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} title="Invite Secretary" onClose={() => setShowModal(false)}>
        <InviteForm onSubmit={handleInvite} onCancel={() => setShowModal(false)} submitting={submitting} error={formError} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this secretary?"
        body={`This will revoke ${deleteTarget?.name}'s access immediately.`}
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
