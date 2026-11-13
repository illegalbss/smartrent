import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaLock, FaUpload, FaFileAlt } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import { STAFF_NAV } from "../../../config/navigation";
import { documentsApi } from "../../../api/documents";
import { tenantsApi } from "../../../api/tenants";

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

// Types staff can upload by hand (tenancy agreements are generated on the tenant's page).
const UPLOAD_TYPES = [
  { value: "GOVERNMENT_ID", label: "Government-issued ID" },
  { value: "REFEREE_FORM", label: "Referee form" },
  { value: "PERSONAL_INFO_SHEET", label: "Personal information sheet" },
  { value: "OTHER", label: "Other" },
];
const TYPE_LABEL = {
  TENANCY_AGREEMENT: "Tenancy agreement",
  GOVERNMENT_ID: "ID",
  REFEREE_FORM: "Referee form",
  PERSONAL_INFO_SHEET: "Personal info sheet",
  UTILITY_BILL: "Utility bill",
  INSPECTION_REPORT: "Inspection report",
  OTHER: "Other",
};
const FILTERS = [
  { key: "ALL", label: "All", types: null },
  { key: "AGREEMENTS", label: "Agreements", types: ["TENANCY_AGREEMENT"] },
  { key: "IDS", label: "IDs", types: ["GOVERNMENT_ID"] },
  { key: "FORMS", label: "Forms", types: ["REFEREE_FORM", "PERSONAL_INFO_SHEET"] },
  { key: "OTHER", label: "Other", types: ["UTILITY_BILL", "INSPECTION_REPORT", "OTHER"] },
];
const MAX_BYTES = 10 * 1024 * 1024; // matches the server's upload limit

function fileKind(doc) {
  const ext = (doc.fileName.split(".").pop() || "").toUpperCase();
  if (doc.mimeType?.includes("pdf") || ext === "PDF") return { label: "PDF", cls: "bg-[#FBE6E6] text-[#8A1C1C]" };
  if (doc.mimeType?.startsWith("image/")) return { label: ext.slice(0, 4) || "IMG", cls: "bg-[#E7F1FB] text-[#1F4E8A]" };
  return { label: ext.slice(0, 4) || "FILE", cls: "bg-[#EEEAE3] text-[#4A443D]" };
}

function sizeText(bytes) {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function UploadCard({ tenants, onUploaded }) {
  const [tenantId, setTenantId] = useState("");
  const [type, setType] = useState("GOVERNMENT_ID");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { kind: "ok" | "error", text }

  function pick(f) {
    setMessage(null);
    if (f && f.size > MAX_BYTES) {
      setFile(null);
      setMessage({ kind: "error", text: "That file is over 10 MB. Please choose a smaller one." });
      return;
    }
    setFile(f || null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!tenantId || !file) {
      setMessage({ kind: "error", text: "Choose a tenant and a file first." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await documentsApi.uploadForTenant(tenantId, file, type);
      setFile(null);
      setMessage({ kind: "ok", text: "Uploaded." });
      onUploaded();
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const fieldCls = `min-h-[44px] w-full rounded-xl border-[1.5px] border-[#D9CFBD] bg-white px-3 text-sm text-site-text ${ring}`;
  return (
    <form onSubmit={submit} className="min-w-0 flex-[1_1_300px] rounded-[18px] border border-[#EFE6D6] bg-white p-6">
      <h2 className="m-0 font-display text-xl font-bold">Upload a file</h2>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={`mt-4 block cursor-pointer rounded-[14px] border-2 border-dashed px-4 py-7 text-center transition-colors focus-within:ring-2 focus-within:ring-gold-500 ${
          dragOver ? "border-brand-700 bg-site-cream" : "border-[#D9CFBD]"
        }`}
      >
        <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        <FaUpload size={26} className="mx-auto text-brand-700" aria-hidden="true" />
        <div className="mt-2 font-semibold">{file ? file.name : "Drop a file here or tap to choose"}</div>
        <div className="mt-1 text-[13px] text-site-muted">{file ? sizeText(file.size) : "PDF, JPG or PNG, up to 10 MB"}</div>
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Attach to tenant
        <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={`mt-1.5 ${fieldCls}`} required>
          <option value="">Choose a tenant…</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.room ? ` — ${t.room.propertyName} ${t.room.roomNumber}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 block text-sm font-semibold">
        Document type
        <select value={type} onChange={(e) => setType(e.target.value)} className={`mt-1.5 ${fieldCls}`}>
          {UPLOAD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`mb-0 mt-3 text-sm font-medium ${message.kind === "error" ? "text-[#8A1C1C]" : "text-[#1F6B3A]"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className={`mt-[18px] flex min-h-[48px] w-full items-center justify-center rounded-xl bg-brand-700 font-bold text-white transition disabled:opacity-60 motion-safe:enabled:hover:-translate-y-0.5 ${ring}`}
      >
        {busy ? "Uploading…" : "Upload"}
      </button>
      <p className="mb-0 mt-3 text-xs text-site-muted">Tenancy agreements are generated from the tenant's page.</p>
    </form>
  );
}

export default function Documents() {
  const [docs, setDocs] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  function load() {
    documentsApi
      .listAll()
      .then((res) => setDocs(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    tenantsApi
      .list({ limit: 500 })
      .then((res) => setTenants([...res.data].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const f of FILTERS) c[f.key] = (docs || []).filter((d) => !f.types || f.types.includes(d.type)).length;
    return c;
  }, [docs]);
  const active = FILTERS.find((f) => f.key === filter);
  const visible = (docs || []).filter((d) => !active.types || active.types.includes(d.type));

  return (
    <DashboardShell navItems={STAFF_NAV} title="Documents" subtitle="Private storage">
      <div className="flex items-start gap-3 rounded-[14px] bg-[#F6E7BC] px-4 py-3.5 text-sm leading-relaxed text-[#5A4100]">
        <FaLock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Only you and your secretary or accountant can open these files. Tenants and shop owners never can, and every download is
          checked against your account.
        </span>
      </div>

      {error && <div className="mt-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

      <div className="mt-4 flex flex-wrap items-start gap-4">
        <UploadCard tenants={tenants} onUploaded={load} />

        <div className="min-w-0 flex-[2_1_460px] rounded-[18px] border border-[#EFE6D6] bg-white px-5 pb-3 pt-1 sm:px-6">
          <div className="flex flex-wrap gap-2 py-3.5" role="group" aria-label="Filter documents by type">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition ${ring} ${
                  filter === f.key ? "bg-brand-700 text-white" : "border-[1.5px] border-[#D9CFBD] bg-white text-site-text hover:border-brand-300"
                }`}
              >
                {f.label} {docs ? counts[f.key] : ""}
              </button>
            ))}
          </div>

          {!docs ? (
            <p className="pb-3 text-sm text-site-muted">Loading documents…</p>
          ) : visible.length === 0 ? (
            <div className="pb-3">
              <EmptyState icon={FaFileAlt} title={docs.length === 0 ? "No documents yet" : "No documents of this type"} body={docs.length === 0 ? "Upload a tenant's ID or forms using the panel on the left." : undefined} />
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {visible.map((d) => {
                const kind = fileKind(d);
                const room = d.tenant.room ? `${d.tenant.room.property.name} ${d.tenant.room.roomNumber}` : null;
                return (
                  <li key={d.id} className="flex items-center gap-3.5 border-t border-[#F3ECDF] py-3.5">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold ${kind.cls}`} aria-hidden="true">
                      {kind.label}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="truncate font-semibold" title={d.fileName}>
                        {d.fileName}
                      </div>
                      <div className="text-[13px] text-site-muted">
                        <Link to={`/dashboard/staff/tenants/${d.tenant.id}`} className={`hover:text-brand-700 hover:underline ${ring}`}>
                          {d.tenant.name}
                        </Link>
                        {room ? ` · ${room}` : ""} · {TYPE_LABEL[d.type] || d.type}
                        {d.sizeBytes ? ` · ${sizeText(d.sizeBytes)}` : ""} · {formatDate(d.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => documentsApi.download(d.id, d.fileName).catch((err) => setError(err.message))}
                      className={`min-h-[44px] shrink-0 px-2 text-sm font-semibold text-brand-700 hover:underline ${ring}`}
                      aria-label={`View ${d.fileName}`}
                    >
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
