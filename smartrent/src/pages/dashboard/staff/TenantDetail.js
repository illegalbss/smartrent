import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaPlus,
  FaTrash,
  FaFileDownload,
  FaFileContract,
  FaSignOutAlt,
  FaCamera,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, Avatar, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { tenantsApi } from "../../../api/tenants";
import { propertiesApi, roomsApi } from "../../../api/properties";
import { paymentsApi } from "../../../api/payments";
import { documentsApi } from "../../../api/documents";

const DOC_TYPES = [
  { value: "REFEREE_FORM", label: "Referee Form" },
  { value: "GOVERNMENT_ID", label: "Government-Issued ID" },
  { value: "PERSONAL_INFO_SHEET", label: "Personal Information Sheet" },
  { value: "OTHER", label: "Other" },
];

function TenantEditForm({ tenant, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    name: tenant.name,
    phone: tenant.phone || "",
    dateCommencement: tenant.dateCommencement?.slice(0, 10) || "",
    dateExpiration: tenant.dateExpiration?.slice(0, 10) || "",
    dateRenewal: tenant.dateRenewal?.slice(0, 10) || "",
    propertyId: tenant.room?.propertyId || "",
    roomId: tenant.roomId || "",
  });
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);

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
      .then((res) => {
        const vacant = res.data.filter((r) => r.status === "VACANT");
        // The tenant's own current room shows as OCCUPIED (by them) — keep it selectable.
        if (tenant.roomId && form.propertyId === tenant.room?.propertyId && !vacant.find((r) => r.id === tenant.roomId)) {
          const current = res.data.find((r) => r.id === tenant.roomId);
          if (current) vacant.unshift(current);
        }
        setRooms(vacant);
      })
      .catch(() => {});
  }, [form.propertyId, tenant.roomId, tenant.room?.propertyId]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, roomId: form.roomId || null });
      }}
    >
      <FormField label="Tenant's Name" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <FormField label="Phone Number" name="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Property</label>
        <select
          value={form.propertyId}
          onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value, roomId: "" }))}
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Unassigned — no property</option>
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
            <option value="">No room selected</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} — {formatNaira(r.rentAmount)}/yr{r.id === tenant.roomId ? " (current)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-3">
        <FormField label="Date Commenced" name="dateCommencement" type="date" value={form.dateCommencement} onChange={(e) => setForm((f) => ({ ...f, dateCommencement: e.target.value }))} />
        <FormField label="Date of Expiration" name="dateExpiration" type="date" value={form.dateExpiration} onChange={(e) => setForm((f) => ({ ...f, dateExpiration: e.target.value }))} />
        <FormField label="Renewal Date" name="dateRenewal" type="date" value={form.dateRenewal} onChange={(e) => setForm((f) => ({ ...f, dateRenewal: e.target.value }))} />
      </div>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function PaymentForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(
    initial || { amount: "", datePaid: "", coverageStart: "", coverageEnd: "", status: "PAID", notes: "" }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <FormField label="Amount (₦)" name="amount" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
      <FormField label="Date Paid" name="datePaid" type="date" value={form.datePaid} onChange={(e) => setForm((f) => ({ ...f, datePaid: e.target.value }))} required />
      <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
        <FormField label="Coverage Start" name="coverageStart" type="date" value={form.coverageStart} onChange={(e) => setForm((f) => ({ ...f, coverageStart: e.target.value }))} />
        <FormField label="Coverage End" name="coverageEnd" type="date" value={form.coverageEnd} onChange={(e) => setForm((f) => ({ ...f, coverageEnd: e.target.value }))} />
      </div>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Status</label>
        <div className="grid grid-cols-3 gap-2">
          {["PAID", "PARTIAL", "OWING"].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setForm((f) => ({ ...f, status: s }))}
              className={`rounded-xl border py-2 text-xs font-bold transition ${
                form.status === s ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:border-brand-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <FormField label="Notes (optional)" name="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Saving…" : "Save Payment"}
        </button>
      </div>
    </form>
  );
}

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [uploadForm, setUploadForm] = useState({ type: "OTHER", file: null });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [offboardConfirm, setOffboardConfirm] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  function load() {
    tenantsApi
      .get(id)
      .then((res) => setTenant(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [id]);

  async function handleEditSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      await tenantsApi.update(id, form);
      setEditModal(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        amount: Number(form.amount),
        datePaid: form.datePaid,
        coverageStart: form.coverageStart || undefined,
        coverageEnd: form.coverageEnd || undefined,
        status: form.status,
        notes: form.notes || undefined,
      };
      if (paymentModal.mode === "add") {
        await paymentsApi.create(id, payload);
      } else {
        await paymentsApi.update(paymentModal.payment.id, payload);
      }
      setPaymentModal(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePayment() {
    try {
      await paymentsApi.remove(deletePayment.id);
      setDeletePayment(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeletePayment(null);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadForm.file) return;
    setSubmitting(true);
    setFormError("");
    try {
      await documentsApi.uploadForTenant(id, uploadForm.file, uploadForm.type);
      setUploadForm({ type: "OTHER", file: null });
      e.target.reset();
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateAgreement() {
    setActionMsg("");
    try {
      await documentsApi.generateAgreement(id);
      setActionMsg("Tenancy Agreement generated.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteDocument(docId) {
    try {
      await documentsApi.remove(docId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOffboard() {
    try {
      await tenantsApi.offboard(id);
      setOffboardConfirm(false);
      load();
    } catch (err) {
      setError(err.message);
      setOffboardConfirm(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    try {
      await tenantsApi.uploadPhoto(id, file);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title={tenant?.name || "Tenant"} subtitle={tenant?.email}>
      <button
        onClick={() => navigate("/dashboard/staff/tenants")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600"
      >
        <FaArrowLeft size={12} /> Back to Tenants
      </button>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      {actionMsg && <div className="mb-4 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{actionMsg}</div>}

      {tenant && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar entity={tenant} photoSrc={tenantsApi.photoUrl(tenant.id)} size="h-16 w-16 text-xl" />
            <div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:bg-ink-50">
                <FaCamera size={11} /> {photoUploading ? "Uploading…" : tenant.hasPhoto ? "Change Photo" : "Upload Photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
              </label>
            </div>
          </div>

          <Card
            title="Tenancy Details"
            action={
              <div className="flex gap-2">
                <button onClick={() => setEditModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:bg-ink-50">
                  <FaEdit size={11} /> Edit
                </button>
                {tenant.room && (
                  <button onClick={() => setOffboardConfirm(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                    <FaSignOutAlt size={11} /> Offboard
                  </button>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Property</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{tenant.room?.property.name || "Unassigned"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Room</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{tenant.room?.roomNumber || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Rent</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{tenant.room ? formatNaira(tenant.room.rentAmount) : "—"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Phone</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{tenant.phone || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Date Commenced</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(tenant.dateCommencement)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Date of Expiration</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(tenant.dateExpiration)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Renewal Date</div>
                <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(tenant.dateRenewal)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-400">Account Status</div>
                <div className="mt-1">
                  <Badge tone={tenant.inviteAcceptedAt ? "green" : "amber"}>{tenant.inviteAcceptedAt ? "Activated" : "Invite Pending"}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Payment Records"
            action={
              <button
                onClick={() => setPaymentModal({ mode: "add" })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600"
              >
                <FaPlus size={11} /> Add Payment
              </button>
            }
          >
            {tenant.payments.length === 0 ? (
              <p className="text-sm text-ink-400">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-ink-100 text-xs font-bold uppercase text-ink-400">
                    <tr>
                      <th className="py-2 pr-4">Date Paid</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Coverage</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Source</th>
                      <th className="py-2 pr-4">Notes</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {tenant.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-4">{formatDate(p.datePaid)}</td>
                        <td className="py-2.5 pr-4 font-semibold text-ink-800">{formatNaira(p.amount)}</td>
                        <td className="py-2.5 pr-4 text-ink-500">
                          {p.coverageStart ? `${formatDate(p.coverageStart)} – ${formatDate(p.coverageEnd)}` : "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge tone={p.status === "PAID" ? "green" : p.status === "PARTIAL" ? "amber" : "red"}>{p.status}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge tone={p.source === "PAYSTACK" ? "brand" : "ink"}>{p.source === "PAYSTACK" ? "Paystack" : "Manual"}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-500">{p.notes || "—"}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex gap-2">
                            <button onClick={() => setPaymentModal({ mode: "edit", payment: p })} className="text-ink-400 hover:text-brand-600">
                              <FaEdit size={13} />
                            </button>
                            <button onClick={() => setDeletePayment(p)} className="text-ink-400 hover:text-red-600">
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Documents"
            action={
              <button
                onClick={handleGenerateAgreement}
                disabled={!tenant.room}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                title={!tenant.room ? "Assign a room before generating an agreement" : ""}
              >
                <FaFileContract size={11} /> Generate Tenancy Agreement
              </button>
            }
          >
            <form onSubmit={handleUpload} className="mb-5 flex flex-col gap-3 rounded-xl bg-ink-50 p-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-ink-700">Document Type</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-ink-700">File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files[0] }))}
                  className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-bold text-white hover:bg-ink-800 disabled:opacity-60">
                Upload
              </button>
            </form>
            {formError && <p className="mb-3 text-sm font-medium text-red-500">{formError}</p>}

            {tenant.documents.length === 0 ? (
              <p className="text-sm text-ink-400">No documents on file.</p>
            ) : (
              <div className="space-y-2">
                {tenant.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-4 py-2.5">
                    <div>
                      <div className="text-sm font-semibold text-ink-800">{d.fileName}</div>
                      <div className="text-xs text-ink-400">
                        {DOC_TYPES.find((t) => t.value === d.type)?.label || d.type} · Uploaded by {d.uploadedByRole.toLowerCase()} · {formatDate(d.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => documentsApi.download(d.id, d.fileName)} className="text-ink-400 hover:text-brand-600" title="Download">
                        <FaFileDownload size={14} />
                      </button>
                      <button onClick={() => handleDeleteDocument(d.id)} className="text-ink-400 hover:text-red-600" title="Delete">
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Modal open={editModal} title="Edit Tenant" onClose={() => setEditModal(false)}>
        {tenant && <TenantEditForm tenant={tenant} onSubmit={handleEditSubmit} onCancel={() => setEditModal(false)} submitting={submitting} error={formError} />}
      </Modal>

      <Modal open={!!paymentModal} title={paymentModal?.mode === "add" ? "Add Payment" : "Edit Payment"} onClose={() => setPaymentModal(null)}>
        {paymentModal && (
          <PaymentForm
            initial={
              paymentModal.mode === "edit"
                ? {
                    amount: paymentModal.payment.amount,
                    datePaid: paymentModal.payment.datePaid?.slice(0, 10),
                    coverageStart: paymentModal.payment.coverageStart?.slice(0, 10) || "",
                    coverageEnd: paymentModal.payment.coverageEnd?.slice(0, 10) || "",
                    status: paymentModal.payment.status,
                    notes: paymentModal.payment.notes || "",
                  }
                : undefined
            }
            onSubmit={handlePaymentSubmit}
            onCancel={() => setPaymentModal(null)}
            submitting={submitting}
            error={formError}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletePayment}
        title="Delete this payment?"
        body="This will permanently remove this payment record. The action will be recorded in the audit trail."
        confirmLabel="Delete"
        danger
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePayment(null)}
      />

      <ConfirmDialog
        open={offboardConfirm}
        title="Offboard this tenant?"
        body="This will vacate their room and unlink them from it. Their record, payments, and documents are kept."
        confirmLabel="Offboard"
        danger
        onConfirm={handleOffboard}
        onCancel={() => setOffboardConfirm(false)}
      />
    </DashboardShell>
  );
}
