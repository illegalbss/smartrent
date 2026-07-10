import { useEffect, useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import { STAFF_NAV } from "../../../config/navigation";
import { complaintsApi } from "../../../api/complaints";

export default function Complaints() {
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState("");
  const [respondTarget, setRespondTarget] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("");

  function load() {
    complaintsApi
      .listForStaff(filter)
      .then((res) => setComplaints(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [filter]);

  async function handleRespond(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await complaintsApi.respond(respondTarget.id, responseText);
      setRespondTarget(null);
      setResponseText("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title="Complaints" subtitle="Messages and complaints raised by tenants">
      <div className="mb-5 flex gap-2">
        {[
          { value: "", label: "All" },
          { value: "OPEN", label: "Open" },
          { value: "RESOLVED", label: "Resolved" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              filter === f.value ? "bg-brand-500 text-white" : "border border-ink-200 text-ink-600 hover:bg-ink-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {complaints && complaints.length === 0 && (
        <EmptyState icon={FaCommentDots} title="No complaints" body="Tenant complaints and messages will appear here." />
      )}

      {complaints && complaints.length > 0 && (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink-900">{c.tenant.name}</div>
                  <div className="text-xs text-ink-400">
                    {c.tenant.room ? `Room ${c.tenant.room.roomNumber} — ${c.tenant.room.property.name}` : "No room assigned"} ·{" "}
                    {formatDate(c.createdAt)}
                  </div>
                </div>
                <Badge tone={c.status === "OPEN" ? "amber" : "green"}>{c.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-700">{c.message}</p>
              {c.response && (
                <div className="mt-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  <span className="font-bold">Response:</span> {c.response}
                </div>
              )}
              {c.status === "OPEN" && (
                <button
                  onClick={() => setRespondTarget(c)}
                  className="mt-4 rounded-lg bg-ink-900 px-4 py-2 text-xs font-bold text-white hover:bg-ink-800"
                >
                  Respond
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!respondTarget} title="Respond to Complaint" onClose={() => setRespondTarget(null)}>
        <form onSubmit={handleRespond}>
          <p className="mb-3 text-sm text-ink-600">{respondTarget?.message}</p>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={4}
            required
            placeholder="Write your response…"
            className="mb-4 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setRespondTarget(null)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
              {submitting ? "Sending…" : "Send & Resolve"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
