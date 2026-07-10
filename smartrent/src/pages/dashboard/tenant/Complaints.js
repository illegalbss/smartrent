import { useEffect, useState } from "react";
import { FaCommentDots, FaPaperPlane } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import { TENANT_NAV } from "../../../config/navigation";
import { complaintsApi } from "../../../api/complaints";

export default function TenantComplaints() {
  const [complaints, setComplaints] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    complaintsApi
      .listOwn()
      .then((res) => setComplaints(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await complaintsApi.create(message.trim());
      setMessage("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell navItems={TENANT_NAV} title="Complaints" subtitle="Send a message or complaint to your landlord">
      <Card title="New Complaint" className="mb-6 max-w-xl">
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            placeholder="Describe the issue…"
            className="mb-4 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          {error && <p className="mb-3 text-sm font-medium text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
          >
            <FaPaperPlane size={12} /> {submitting ? "Sending…" : "Send"}
          </button>
        </form>
      </Card>

      {complaints && complaints.length === 0 && (
        <EmptyState icon={FaCommentDots} title="No complaints yet" body="Complaints you send will appear here along with any response." />
      )}

      {complaints && complaints.length > 0 && (
        <div className="space-y-4">
          {complaints.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs text-ink-400">{formatDate(c.createdAt)}</div>
                <Badge tone={c.status === "OPEN" ? "amber" : "green"}>{c.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-700">{c.message}</p>
              {c.response && (
                <div className="mt-3 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                  <span className="font-bold">Response:</span> {c.response}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
