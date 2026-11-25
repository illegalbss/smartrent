import { useEffect, useMemo, useState } from "react";
import { FaLock, FaHistory } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, EmptyState, formatNaira, formatDate } from "../../../components/dashboard/UiKit";
import { STAFF_NAV } from "../../../config/navigation";
import { paymentsApi } from "../../../api/payments";
import { tenantsApi } from "../../../api/tenants";
import { api } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import { logPrint } from "../../../utils/printReports";

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

const PAYMENT_EVENT = {
  CREATED: { label: "Payment recorded", tone: "green" },
  EDITED: { label: "Payment edited", tone: "amber" },
  DELETED: { label: "Payment deleted", tone: "red" },
};
const LOGIN_EVENT = {
  LOGIN_SUCCESS: { label: "Login", tone: "ink" },
  LOGIN_FAILED: { label: "Failed login", tone: "red" },
};
// Everything else staff do (see server/src/middleware/staffActivity.js).
const ACTION_LABEL = {
  TENANT_REGISTERED: "Tenant added",
  TENANT_UPDATED: "Tenant edited",
  TENANCY_ENDED: "Tenancy ended",
  TENANT_DELETED: "Tenant deleted",
  LOGIN_LINK_CREATED: "Login link created",
  LOGIN_LINKS_GENERATED: "Login links created",
  TENANT_PHOTO_CHANGED: "Photo changed",
  DOCUMENT_UPLOADED: "Document uploaded",
  AGREEMENT_GENERATED: "Agreement generated",
  DOCUMENT_VIEWED: "Document opened",
  DOCUMENT_DELETED: "Document deleted",
  STATEMENT_DOWNLOADED: "Statement downloaded",
  RECEIPT_DOWNLOADED: "Receipt downloaded",
  INVOICE_DOWNLOADED: "Invoice downloaded",
  PRINTED: "Printed / exported",
  SECRETARY_JOINED: "Secretary joined",
  PROPERTY_ADDED: "Property added",
  PROPERTY_UPDATED: "Property edited",
  PROPERTY_DELETED: "Property deleted",
  PROPERTY_PHOTO_CHANGED: "Photo changed",
  ROOM_ADDED: "Room added",
  ROOM_UPDATED: "Room edited",
  ROOM_DELETED: "Room deleted",
  COMPLAINT_LOGGED: "Message logged",
  COMPLAINT_UPDATED: "Message updated",
  COMPLAINT_REPLIED: "Message replied",
  MAINTENANCE_UPDATED: "Maintenance updated",
  NOTICE_SENT: "Notice sent",
  NOTICE_DELETED: "Notice deleted",
  HOUSE_RULES_UPDATED: "House rules updated",
  HOUSE_RULES_DELETED: "House rules deleted",
  SECRETARY_INVITED: "Secretary invited",
  SECRETARY_REMOVED: "Secretary removed",
  PAYOUT_ACCOUNT_CHANGED: "Payout account changed",
  PROFILE_UPDATED: "Profile updated",
  PASSWORD_CHANGED: "Password changed",
};
// Red for things that remove or end something (and the payout bank account,
// where a change redirects money); amber for edits; green for additions.
function actionTone(action) {
  if (/DELETED|REMOVED|ENDED|PAYOUT/.test(action)) return "red";
  if (/UPDATED|CHANGED|REPLIED|LINK/.test(action)) return "amber";
  if (/VIEWED|DOWNLOADED|PRINTED/.test(action)) return "ink";
  return "green";
}
const CATEGORY_KIND = {
  tenants: "TENANTS",
  properties: "TENANTS",
  documents: "DOCUMENTS",
  downloads: "DOCUMENTS",
  messages: "MESSAGES",
  team: "TEAM",
  account: "TEAM",
};

const ROLE = { LANDLORD: "Landlord", SECRETARY: "Secretary", TENANT: "Tenant" };

function whenText(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${formatDate(d)}, ${time}`;
}

// What changed between the before/after copies of an edited payment.
function editSummary(prev, next) {
  if (!prev || !next) return "";
  const changes = [];
  if (Number(prev.amount) !== Number(next.amount)) changes.push(`amount ${formatNaira(prev.amount)} → ${formatNaira(next.amount)}`);
  if (prev.status !== next.status) changes.push(`status ${prev.status.toLowerCase()} → ${next.status.toLowerCase()}`);
  if (prev.datePaid?.slice(0, 10) !== next.datePaid?.slice(0, 10)) changes.push(`date ${formatDate(prev.datePaid)} → ${formatDate(next.datePaid)}`);
  if ((prev.notes || "") !== (next.notes || "")) changes.push("notes changed");
  return changes.length ? `Changed ${changes.join(", ")}` : "No visible changes";
}

function paymentEntry(log, tenantNames) {
  const data = log.newData || log.previousData || {};
  const tenant = tenantNames.get(data.tenantId) || "a tenant";
  const base = `${formatNaira(data.amount)} for ${tenant}`;
  const receipt = log.paymentId || data.id ? ` · receipt #${(log.paymentId || data.id).slice(-8).toUpperCase()}` : "";
  const details =
    log.action === "EDITED" ? `${tenant}${receipt}. ${editSummary(log.previousData, log.newData)}` : `${base}, paid ${formatDate(data.datePaid)}${receipt}`;
  return {
    id: `p-${log.id}`,
    kind: "PAYMENTS",
    at: log.createdAt,
    who: `${log.performedByName} (${ROLE[log.performedByRole] || log.performedByRole})`,
    event: PAYMENT_EVENT[log.action] || { label: log.action, tone: "ink" },
    details,
  };
}

function staffEntry(log) {
  return {
    id: `s-${log.id}`,
    kind: CATEGORY_KIND[log.category] || "TEAM",
    at: log.createdAt,
    who: `${log.actorName} (${ROLE[log.actorRole] || log.actorRole})`,
    event: { label: ACTION_LABEL[log.action] || log.action, tone: actionTone(log.action) },
    details: log.summary + (log.ipAddress ? ` · IP ${log.ipAddress}` : ""),
  };
}

function loginEntry(log) {
  const who = log.userName ? `${log.userName} (${ROLE[log.userRole] || log.userRole})` : `Unknown (${log.attemptedEmail || "no email"})`;
  return {
    id: `l-${log.id}`,
    kind: "LOGINS",
    at: log.createdAt,
    who,
    event: LOGIN_EVENT[log.action] || { label: log.action, tone: "ink" },
    details: log.ipAddress ? `From IP address ${log.ipAddress}` : "",
  };
}

function exportCsv(rows) {
  const header = ["When", "Who", "What happened", "Details"];
  const lines = rows.map((r) => [new Date(r.at).toLocaleString("en-NG"), r.who, r.event.label, r.details]);
  const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `RentaFlow-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  logPrint("HISTORY_CSV", `${rows.length} entries`);
}

export default function History() {
  const { user } = useAuth();
  const isLandlord = user.role === "landlord";
  const [entries, setEntries] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [person, setPerson] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      paymentsApi.auditLog(),
      tenantsApi.list({ limit: 500 }).catch(() => ({ data: [] })),
      // Login records are the landlord's own account security — not shown to secretaries.
      isLandlord ? api.get("/landlord/login-activity").catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      // The full record of staff actions is for the landlord only, so a
      // secretary can't see (or work around) what is being recorded.
      isLandlord ? api.get("/landlord/activity").catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ])
      .then(([audit, tenants, logins, activity]) => {
        const names = new Map(tenants.data.map((t) => [t.id, t.name]));
        const all = [...audit.data.map((l) => paymentEntry(l, names)), ...logins.data.map(loginEntry), ...activity.data.map(staffEntry)];
        all.sort((a, b) => new Date(b.at) - new Date(a.at));
        setEntries(all);
      })
      .catch((err) => setError(err.message));
  }, [isLandlord]);

  const filters = [
    { key: "ALL", label: "Everything" },
    { key: "PAYMENTS", label: "Payments" },
    ...(isLandlord
      ? [
          { key: "TENANTS", label: "Tenants & rooms" },
          { key: "DOCUMENTS", label: "Documents" },
          { key: "MESSAGES", label: "Messages & notices" },
          { key: "TEAM", label: "Team & account" },
          { key: "LOGINS", label: "Logins" },
        ]
      : []),
  ];
  const people = useMemo(() => [...new Set((entries || []).map((e) => e.who))].sort(), [entries]);
  const visible = useMemo(
    () => (entries || []).filter((e) => (filter === "ALL" || e.kind === filter) && (person === "ALL" || e.who === person)),
    [entries, filter, person]
  );

  return (
    <DashboardShell navItems={STAFF_NAV} title="History log" subtitle="Who did what, and when">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        {isLandlord && people.length > 1 && (
          <label className="flex items-center gap-2 text-sm font-semibold text-site-text">
            Person
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className={`min-h-[44px] rounded-xl border-[1.5px] border-[#D9CFBD] bg-white px-3 text-sm font-medium ${ring}`}
            >
              <option value="ALL">Everyone</option>
              {people.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          onClick={() => exportCsv(visible)}
          disabled={!visible.length}
          className={`inline-flex min-h-[44px] items-center rounded-xl border-[1.5px] border-brand-700 bg-white px-5 font-bold text-brand-700 transition disabled:opacity-40 motion-safe:enabled:hover:-translate-y-0.5 ${ring}`}
        >
          Export CSV
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-[14px] bg-[#F6E7BC] px-4 py-3.5 text-sm leading-relaxed text-[#5A4100]">
        <FaLock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          This log is read-only. Entries cannot be edited or deleted by anyone, including you.
          {isLandlord &&
            " Every change made by you or your secretaries is recorded automatically — payments, tenants, rooms and rent, documents (including who opened them), messages, notices and team changes."}
        </span>
      </div>

      <div className="mt-[18px] flex flex-wrap gap-2" role="group" aria-label="Filter history">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`min-h-[44px] rounded-full px-[18px] text-sm font-semibold transition ${ring} ${
              filter === f.key ? "bg-brand-700 text-white" : "border-[1.5px] border-[#D9CFBD] bg-white text-site-text hover:border-brand-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

      <div className="mt-4 rounded-[18px] border border-[#EFE6D6] bg-white px-4 pb-3 pt-1 sm:px-6">
        {!entries && !error ? (
          <p className="py-4 text-sm text-site-muted">Loading history…</p>
        ) : visible.length === 0 ? (
          <div className="py-3">
            <EmptyState icon={FaHistory} title="Nothing here yet" body={isLandlord ? "Every change made by you or your secretaries will appear here." : "Payments recorded, edited or deleted will appear here."} />
          </div>
        ) : (
          <>
            {/* Phones: one block per entry. */}
            <ul className="m-0 list-none p-0 md:hidden">
              {visible.map((e) => (
                <li key={e.id} className="border-b border-[#F3ECDF] py-3.5 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={e.event.tone}>{e.event.label}</Badge>
                    <span className="text-xs text-site-muted">{whenText(e.at)}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-semibold">{e.who}</div>
                  {e.details && <div className="mt-0.5 text-[13px] text-site-muted">{e.details}</div>}
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-site-muted">
                    {["When", "Who", "What happened", "Details"].map((h) => (
                      <th key={h} className="border-b border-[#EEE6D8] px-2 py-3.5 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e) => (
                    <tr key={e.id} className="border-b border-[#F3ECDF] last:border-b-0">
                      <td className="whitespace-nowrap px-2 py-3.5">{whenText(e.at)}</td>
                      <td className="px-2 py-3.5">{e.who}</td>
                      <td className="whitespace-nowrap px-2 py-3.5">
                        <Badge tone={e.event.tone}>{e.event.label}</Badge>
                      </td>
                      <td className="px-2 py-3.5 text-site-muted">{e.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
