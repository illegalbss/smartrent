import { useEffect, useState } from "react";
import {
  FaCrown,
  FaBuilding,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaPlus,
  FaEdit,
  FaBan,
  FaCheckCircle,
  FaSignOutAlt,
  FaTrash,
  FaChevronDown,
  FaChevronRight,
  FaStore,
  FaHome,
  FaHistory,
  FaChartBar,
} from "react-icons/fa";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { superAdminApi } from "../../api/superAdmin";
import { formatDate, formatNaira, formatNairaCompact } from "../../components/dashboard/UiKit";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: FaChartBar },
  { key: "landlords", label: "Landlords", icon: FaBuilding },
  { key: "properties-detail", label: "Properties Detail", icon: FaHome },
  { key: "activity-logs", label: "Activity Logs", icon: FaHistory },
  { key: "revenue", label: "Revenue", icon: FaMoneyBillWave },
  { key: "plans", label: "Plans and Pricing", icon: FaFileInvoiceDollar },
  { key: "transactions", label: "Transactions", icon: FaFileInvoiceDollar },
];

// Status chips in the design-spec colours (all pass 4.5:1).
const STATUS_TONE = {
  ACTIVE: "bg-[#E3F2E7] text-[#1F6B3A]",
  TRIAL: "bg-[#FFF1CC] text-[#6B4E00]",
  EXPIRED: "bg-[#FBE6E6] text-[#8A1C1C]",
  CANCELED: "bg-[#EEEAE3] text-[#4A443D]",
};
const STATUS_LABEL = { ACTIVE: "Active", TRIAL: "Trial", EXPIRED: "Expired", CANCELED: "Deactivated" };

function Badge({ tone, children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>;
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] text-site-muted">{label}</p>
        {Icon && <Icon size={13} className="text-gold-600" aria-hidden="true" />}
      </div>
      <p className="m-0 mt-1 font-display text-[26px] font-bold text-site-text">{value}</p>
    </div>
  );
}

const WEEK_MS = 7 * 86400000;
const adminRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

// Landing view for the Super Admin, built from data the other sections
// already load (landlords, revenue, storage, login logs).
function OverviewSection({ landlords, revenue, storageUsage, logs, onOpenLandlords }) {
  const count = (status) => landlords.filter((l) => l.subscriptionStatus === status).length;
  const now = Date.now();
  const trialsEndingSoon = landlords.filter(
    (l) => l.subscriptionStatus === "TRIAL" && l.nextBillingDate && new Date(l.nextBillingDate).getTime() - now <= WEEK_MS
  ).length;
  const failedLogins24h = (logs || []).filter((g) => g.action === "LOGIN_FAILED" && now - new Date(g.createdAt).getTime() <= 86400000).length;

  // New landlords per week, oldest first.
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const end = now - (5 - i) * WEEK_MS;
    const start = end - WEEK_MS;
    return landlords.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      return t > start && t <= end;
    }).length;
  });
  const maxWeek = Math.max(...weeks, 1);
  const recent = [...landlords].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const storage = storageUsage?.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
        <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
          <div className="text-[13px] text-site-muted">Landlords</div>
          <div className="mt-1 font-display text-[30px] font-bold">{landlords.length}</div>
          <div className="mt-2 text-[13px] text-site-muted">
            {count("ACTIVE")} active, {count("TRIAL")} on trial
          </div>
        </div>
        <div className="rounded-[18px] bg-brand-700 p-5 text-white">
          <div className="text-[13px] text-[#F3D9A0]">Revenue this month</div>
          <div className="mt-1 truncate font-display text-[30px] font-bold" title={revenue ? formatNaira(revenue.monthlyRevenue) : undefined}>
            {revenue ? formatNairaCompact(revenue.monthlyRevenue) : "…"}
          </div>
          {revenue && <div className="mt-2 text-[13px] text-[#F3D9A0]">{formatNairaCompact(revenue.totalRevenue)} all time</div>}
        </div>
        <div className="rounded-[18px] bg-[#FBE6E6] p-5 text-[#8A1C1C]">
          <div className="text-[13px]">Subscriptions expired</div>
          <div className="mt-1 font-display text-[30px] font-bold">{count("EXPIRED")}</div>
        </div>
        <div className="rounded-[18px] bg-[#FFF1CC] p-5 text-[#6B4E00]">
          <div className="text-[13px]">Trials</div>
          <div className="mt-1 font-display text-[30px] font-bold">{count("TRIAL")}</div>
          <div className="mt-2 text-[13px]">{trialsEndingSoon} ending within 7 days</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-0 flex-[2_1_460px] rounded-[18px] border border-[#EFE6D6] bg-white px-5 pb-3 pt-1 sm:px-6">
          <div className="flex items-center justify-between py-3.5">
            <h2 className="m-0 font-display text-xl font-bold">Newest landlords</h2>
            <button onClick={onOpenLandlords} className="min-h-[44px] px-1 text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[13px] text-site-muted">
                  <th className="border-b border-[#EEE6D8] py-2 pr-2 font-medium">Landlord</th>
                  <th className="hidden border-b border-[#EEE6D8] py-2 pr-2 font-medium sm:table-cell">Plan</th>
                  <th className="border-b border-[#EEE6D8] py-2 pr-2 font-medium">Rooms</th>
                  <th className="border-b border-[#EEE6D8] py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((l) => (
                  <tr key={l.id} className="border-b border-[#F3ECDF] last:border-b-0">
                    <td className="py-3 pr-2">
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-xs text-site-muted">Joined {formatDate(l.createdAt)}</div>
                    </td>
                    <td className="hidden py-3 pr-2 sm:table-cell">{l.plan?.name || "—"}</td>
                    <td className="py-3 pr-2">{l.totalRooms}</td>
                    <td className="py-3">
                      <Badge tone={STATUS_TONE[l.subscriptionStatus]}>{STATUS_LABEL[l.subscriptionStatus] || l.subscriptionStatus}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
            <h2 className="m-0 font-display text-xl font-bold">New landlords, last 6 weeks</h2>
            <div
              className="mt-4 flex h-[110px] items-end gap-2.5 border-b border-site-border"
              role="img"
              aria-label={`New landlord sign-ups per week, oldest to newest: ${weeks.join(", ")}`}
            >
              {weeks.map((n, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-[11px] text-site-muted">{n}</span>
                  <div className={`w-full rounded-t-md ${i === 5 ? "bg-brand-700" : "bg-[#E6C26A]"}`} style={{ height: `${Math.max((n / maxWeek) * 80, 3)}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-site-muted" aria-hidden="true">
              <span>6 weeks ago</span>
              <span>This week</span>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5">
            <h2 className="m-0 font-display text-xl font-bold">Platform health</h2>
            <dl className="m-0 mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Failed logins, last 24h</dt>
                <dd className={`m-0 font-semibold ${failedLogins24h > 10 ? "text-[#8A1C1C]" : ""}`}>{logs ? failedLogins24h : "…"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>File storage used</dt>
                <dd className={`m-0 font-semibold ${storage?.warning ? "text-[#8A1C1C]" : "text-[#1F6B3A]"}`}>
                  {storage ? `${storage.usedPercent}%` : "…"}
                </dd>
              </div>
            </dl>
          </div>

          <p className="m-0 rounded-[14px] bg-[#F6E7BC] px-4 py-3.5 text-[13px] leading-relaxed text-[#5A4100]">
            Super admin sees landlords, billing and counts only. Tenant records and private documents are never shown here.
          </p>
        </div>
      </div>
    </div>
  );
}

function LandlordForm({ initial, plans, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState(
    initial || { name: "", email: "", password: "", phone: "", planId: "", subscriptionStatus: "ACTIVE", nextBillingDate: "" }
  );
  const isEdit = !!initial;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <FormField label="Landlord's Name" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <FormField label="Email Address" name="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required disabled={isEdit} />
      {!isEdit && (
        <FormField label="Password" name="password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
      )}
      <FormField label="Phone (optional)" name="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Plan</label>
        <select
          value={form.planId || ""}
          onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-700 focus:bg-white"
        >
          <option value="">No plan assigned</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name} — {formatNaira(p.price)}/year</option>
          ))}
        </select>
      </div>

      {isEdit && (
        <>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">Subscription Status</label>
            <select
              value={form.subscriptionStatus}
              onChange={(e) => setForm((f) => ({ ...f, subscriptionStatus: e.target.value }))}
              className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-700 focus:bg-white"
            >
              {["TRIAL", "ACTIVE", "EXPIRED", "CANCELED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <FormField
            label="Next Billing Date"
            name="nextBillingDate"
            type="date"
            value={form.nextBillingDate}
            onChange={(e) => setForm((f) => ({ ...f, nextBillingDate: e.target.value }))}
          />
          <label className="mb-4 flex cursor-pointer items-start gap-2.5 rounded-lg bg-ink-50 px-3.5 py-3">
            <input
              type="checkbox"
              checked={form.automaticPaymentsEnabled}
              onChange={(e) => setForm((f) => ({ ...f, automaticPaymentsEnabled: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-gold-500"
            />
            <span className="text-xs text-ink-600">
              <span className="block font-semibold text-ink-800">Automatic Payments add-on</span>
              Lets this landlord's tenants/shop owners pay rent online through Paystack. Enable only once they've
              requested and paid for the add-on.
            </span>
          </label>
        </>
      )}

      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">Cancel</button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Landlord"}
        </button>
      </div>
    </form>
  );
}

function PlanForm({ plan, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ name: plan.name, roomLimit: plan.roomLimit ?? "", price: plan.price });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <FormField label="Plan Name" name="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
      <FormField
        label="Room Limit (leave blank for unlimited)"
        name="roomLimit"
        type="number"
        value={form.roomLimit}
        onChange={(e) => setForm((f) => ({ ...f, roomLimit: e.target.value }))}
      />
      <FormField label="Price (₦ / year)" name="price" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">Cancel</button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60">
          {submitting ? "Saving…" : "Save Plan"}
        </button>
      </div>
    </form>
  );
}

function PropertiesDetailSection({ landlords }) {
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filtered = term
    ? landlords.filter(
        (l) => l.name.toLowerCase().includes(term) || l.properties.some((p) => p.name.toLowerCase().includes(term))
      )
    : landlords;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink-900">Landlords &amp; Their Properties</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search landlord or property…"
          className="w-64 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-700"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((l) => {
          const isOpen = !!expanded[l.id];
          return (
            <div key={l.id} className="overflow-hidden rounded-[18px] border border-[#EFE6D6] bg-white">
              <button
                onClick={() => setExpanded((e) => ({ ...e, [l.id]: !e[l.id] }))}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F6E7BC] text-sm font-bold text-brand-700">
                    {l.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-ink-900">{l.name}</div>
                    <div className="text-xs text-ink-400">
                      {l.email} · {l.accountType || "—"} · {l.plan?.name || "No plan"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-ink-500">
                  <span>Properties: <b className="text-ink-800">{l.totalProperties}</b></span>
                  <span>Rooms: <b className="text-ink-800">{l.totalRooms}</b></span>
                  <span>Stores: <b className="text-ink-800">{l.totalStores}</b></span>
                  {isOpen ? <FaChevronDown size={11} /> : <FaChevronRight size={11} />}
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-[#F3ECDF] border-t border-[#F3ECDF]">
                  {l.properties.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-ink-400">No properties yet.</p>
                  ) : (
                    l.properties.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 pl-14">
                        <div className="flex items-center gap-2.5">
                          {p.propertyType === "COMMERCIAL" ? (
                            <FaStore size={12} className="text-ink-400" />
                          ) : (
                            <FaHome size={12} className="text-ink-400" />
                          )}
                          <span className="text-sm font-semibold text-ink-800">{p.name}</span>
                          <Badge tone={p.propertyType === "COMMERCIAL" ? "bg-ink-200 text-ink-700" : "bg-[#EEEAE3] text-[#4A443D]"}>
                            {p.propertyType === "COMMERCIAL" ? "Commercial" : "Residential"}
                          </Badge>
                        </div>
                        <div className="text-xs text-ink-500">
                          {p.totalRooms} {p.propertyType === "COMMERCIAL" ? "units" : "rooms"} · {p.occupiedRooms} occupied
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LandlordsSection({ landlords, plans, onCreate, onEdit, onToggleActive, onDelete }) {
  const activeCount = landlords.filter((l) => l.subscriptionStatus === "ACTIVE").length;
  // Annual license fees, not monthly — this is the active-landlord run-rate,
  // not what actually landed this calendar month (see the Revenue tab for that).
  const annualRevenue = landlords
    .filter((l) => l.subscriptionStatus === "ACTIVE" && l.plan)
    .reduce((sum, l) => sum + Number(l.plan.price), 0);
  const totalRooms = landlords.reduce((sum, l) => sum + l.totalRooms, 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Landlords signed up" value={landlords.length} icon={FaBuilding} />
        <StatCard label="Active subscriptions" value={activeCount} icon={FaCheckCircle} />
        <StatCard label="Annual license revenue" value={formatNaira(annualRevenue)} icon={FaMoneyBillWave} />
        <StatCard label="Total rooms managed" value={totalRooms} icon={FaFileInvoiceDollar} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-[18px] border border-[#EFE6D6] bg-white p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-900">{p.name}</span>
            </div>
            <p className="text-xl font-extrabold text-ink-900">
              {formatNaira(p.price)} <small className="text-xs font-normal text-ink-400">/year</small>
            </p>
            <p className="mt-1 text-xs text-ink-500">{p.roomLimit ? `Up to ${p.roomLimit} rooms` : "Unlimited rooms"}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink-900">Landlord accounts</h2>
        <button onClick={onCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 min-h-[44px] px-4 text-sm font-bold text-white hover:bg-brand-800">
          <FaPlus size={11} /> Add Landlord
        </button>
      </div>
      <div className="overflow-x-auto rounded-[18px] border border-[#EFE6D6] bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="text-xs font-bold uppercase text-ink-400">
              <th className="px-4 py-3">Landlord</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Rooms</th>
              <th className="px-4 py-3">Tenants</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Auto-Pay</th>
              <th className="px-4 py-3">Next Billing</th>
              <th className="px-4 py-3">Signed Up</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3ECDF]">
            {landlords.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink-800">{l.name}</div>
                  <div className="text-xs text-ink-400">{l.email}</div>
                </td>
                <td className="px-4 py-3 text-ink-600">{l.plan?.name || "—"}</td>
                <td className="px-4 py-3 text-ink-600">{l.totalRooms}</td>
                <td className="px-4 py-3 text-ink-600">{l.totalTenants}</td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[l.subscriptionStatus]}>{STATUS_LABEL[l.subscriptionStatus] || l.subscriptionStatus}</Badge></td>
                <td className="px-4 py-3">
                  {l.automaticPaymentsEnabled ? <Badge tone="bg-green-100 text-green-700">Enabled</Badge> : <span className="text-ink-300">Off</span>}
                </td>
                <td className="px-4 py-3 text-ink-600">{l.nextBillingDate ? formatDate(l.nextBillingDate) : "—"}</td>
                <td className="px-4 py-3 text-ink-600">{formatDate(l.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => onEdit(l)} className="text-ink-400 hover:text-brand-700" title="Edit">
                      <FaEdit size={13} />
                    </button>
                    <button
                      onClick={() => onToggleActive(l)}
                      className={l.subscriptionStatus === "CANCELED" ? "text-ink-400 hover:text-green-600" : "text-ink-400 hover:text-red-600"}
                      title={l.subscriptionStatus === "CANCELED" ? "Reactivate" : "Deactivate"}
                    >
                      {l.subscriptionStatus === "CANCELED" ? <FaCheckCircle size={13} /> : <FaBan size={13} />}
                    </button>
                    <button onClick={() => onDelete(l)} className="text-ink-400 hover:text-red-600" title="Delete permanently">
                      <FaTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function StorageUsageCard({ usage }) {
  if (!usage) return null;
  if (!usage.data) {
    return <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-5 text-sm text-ink-500">{usage.error || "Storage usage unavailable."}</div>;
  }
  const d = usage.data;
  return (
    <div className={`rounded-[18px] border p-5 ${d.warning ? "border-[#F2D27A] bg-[#FFF1CC]" : "border-[#EFE6D6] bg-white"}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">Cloudinary Storage ({d.plan} plan)</h3>
        {d.warning && <span className="text-xs font-bold text-amber-700">⚠ Approaching monthly limit</span>}
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${d.warning ? "bg-amber-500" : "bg-site-cream0"}`}
          style={{ width: `${Math.min(d.usedPercent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-ink-500">
        {d.creditsUsed} / {d.creditsLimit} credits used ({d.usedPercent}%) — {formatBytes(d.storageBytes)} stored, {d.objectCount} files.
        Free tier suspends uploads (no overage billing) once credits run out for the month.
      </p>
    </div>
  );
}

function RevenueSection({ revenue, storageUsage }) {
  if (!revenue) return null;
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatCard label="Revenue this month" value={formatNaira(revenue.monthlyRevenue)} icon={FaMoneyBillWave} />
        <StatCard label="Total revenue (all time)" value={formatNaira(revenue.totalRevenue)} icon={FaFileInvoiceDollar} />
      </div>
      <div className="mb-6 rounded-[18px] border border-[#EFE6D6] bg-white p-5">
        <h3 className="mb-3 text-sm font-bold text-ink-900">Monthly Revenue (last 12 months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue.monthlySeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5C1010" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5C1010" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8792a2" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8792a2" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`)} width={50} />
              <Tooltip formatter={(value) => formatNaira(value)} />
              <Area type="monotone" dataKey="total" stroke="#5C1010" strokeWidth={2.5} fill="url(#revenueFill)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <StorageUsageCard usage={storageUsage} />
    </div>
  );
}

function PlansSection({ plans, onEdit, onCreate }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink-900">Subscription Plans</h2>
        <button onClick={onCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 min-h-[44px] px-4 text-sm font-bold text-white hover:bg-brand-800">
          <FaPlus size={11} /> Add Plan
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-[18px] border border-[#EFE6D6] bg-white p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-900">{p.name}</span>
              <button onClick={() => onEdit(p)} className="text-ink-400 hover:text-brand-700"><FaEdit size={13} /></button>
            </div>
            <p className="text-xl font-extrabold text-ink-900">
              {formatNaira(p.price)} <small className="text-xs font-normal text-ink-400">/year</small>
            </p>
            <p className="mt-1 text-xs text-ink-500">{p.roomLimit ? `Up to ${p.roomLimit} rooms` : "Unlimited rooms"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLogsSection({ logs, landlords, roleFilter, setRoleFilter, landlordFilter, setLandlordFilter }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-ink-900">Login &amp; Activity Logs</h2>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-700"
          >
            <option value="">All Roles</option>
            <option value="LANDLORD">Landlord</option>
            <option value="SECRETARY">Secretary</option>
          </select>
          <select
            value={landlordFilter}
            onChange={(e) => setLandlordFilter(e.target.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-700"
          >
            <option value="">All Landlords</option>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-8 text-center text-sm text-ink-400">No activity recorded yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-[18px] border border-[#EFE6D6] bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase text-ink-400">
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Landlord Account</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3ECDF]">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-ink-600">{new Date(log.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3 text-ink-800">{log.userName || `Unknown (${log.attemptedEmail || "no email"})`}</td>
                  <td className="px-4 py-3"><Badge tone="bg-[#EEEAE3] text-[#4A443D]">{log.userRole}</Badge></td>
                  <td className="px-4 py-3 text-ink-600">{log.landlord?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {log.action === "LOGIN_SUCCESS" ? (
                      <span className="font-semibold text-green-600">✓ Login successful</span>
                    ) : (
                      <span className="font-semibold text-red-600">✗ Failed login attempt</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionsSection({ transactions }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold text-ink-900">Billing Transactions</h2>
      {transactions.length === 0 ? (
        <div className="rounded-[18px] border border-[#EFE6D6] bg-white p-8 text-center text-sm text-ink-400">
          No billing transactions yet — this fills in once Paystack subscription billing is wired up.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[18px] border border-[#EFE6D6] bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase text-ink-400">
                <th className="px-4 py-3">Landlord</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3ECDF]">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-800">{t.landlord.name}</div>
                    <div className="text-xs text-ink-400">{t.landlord.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{t.plan?.name || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-ink-800">{formatNaira(t.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={t.status === "SUCCESS" ? "bg-green-100 text-green-700" : t.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{t.paystackReference}</td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState("overview");
  const [landlords, setLandlords] = useState(null);
  const [plans, setPlans] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [storageUsage, setStorageUsage] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [activityLogs, setActivityLogs] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [landlordFilter, setLandlordFilter] = useState("");
  const [error, setError] = useState("");

  const [landlordModal, setLandlordModal] = useState(null); // { mode: 'create' | 'edit', landlord? }
  const [planModal, setPlanModal] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function loadLandlords() {
    superAdminApi.listLandlords().then((res) => setLandlords(res.data)).catch((err) => setError(err.message));
  }
  function loadPlans() {
    superAdminApi.listPlans().then((res) => setPlans(res.data)).catch((err) => setError(err.message));
  }
  function loadRevenue() {
    superAdminApi.revenue().then((res) => setRevenue(res.data)).catch((err) => setError(err.message));
    superAdminApi.storageUsage().then((res) => setStorageUsage(res)).catch(() => {});
  }
  function loadTransactions() {
    superAdminApi.transactions().then((res) => setTransactions(res.data)).catch((err) => setError(err.message));
  }
  function loadActivityLogs() {
    superAdminApi
      .activityLogs({ role: roleFilter, landlordId: landlordFilter })
      .then((res) => setActivityLogs(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadLandlords();
    loadPlans();
  }, []);

  useEffect(() => {
    if ((section === "revenue" || section === "overview") && !revenue) loadRevenue();
    if (section === "overview" && !activityLogs) loadActivityLogs();
    if (section === "transactions" && !transactions) loadTransactions();
    if (section === "activity-logs") loadActivityLogs();
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (section === "activity-logs") loadActivityLogs();
  }, [roleFilter, landlordFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLandlordSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      if (landlordModal.mode === "create") {
        await superAdminApi.createLandlord({ ...form, planId: form.planId || null });
      } else {
        await superAdminApi.updateLandlord(landlordModal.landlord.id, {
          name: form.name,
          phone: form.phone,
          planId: form.planId || null,
          subscriptionStatus: form.subscriptionStatus,
          nextBillingDate: form.nextBillingDate || null,
          automaticPaymentsEnabled: form.automaticPaymentsEnabled,
        });
      }
      setLandlordModal(null);
      loadLandlords();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    try {
      if (toggleTarget.subscriptionStatus === "CANCELED") {
        await superAdminApi.reactivateLandlord(toggleTarget.id);
      } else {
        await superAdminApi.deactivateLandlord(toggleTarget.id);
      }
      setToggleTarget(null);
      loadLandlords();
    } catch (err) {
      setError(err.message);
      setToggleTarget(null);
    }
  }

  async function handleDeleteLandlord() {
    try {
      await superAdminApi.deleteLandlord(deleteTarget.id);
      setDeleteTarget(null);
      loadLandlords();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  async function handlePlanSubmit(form) {
    setSubmitting(true);
    setFormError("");
    try {
      if (planModal.mode === "create") {
        await superAdminApi.createPlan(form);
      } else {
        await superAdminApi.updatePlan(planModal.plan.id, form);
      }
      setPlanModal(null);
      loadPlans();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-site-cream text-site-text lg:flex-row">
      {/* Phones: a top bar with a scrollable row of sections. lg+: deep-maroon sidebar. */}
      <aside className="shrink-0 bg-site-deep px-4 py-4 text-[#E8DADA] lg:w-60 lg:px-4 lg:py-6">
        <div className="flex items-center justify-between gap-3 lg:block">
          <div className="flex items-center gap-2.5 px-2 text-white lg:pb-5">
            <svg width="34" height="34" viewBox="0 0 36 36" aria-hidden="true">
              <rect width="36" height="36" rx="10" fill="#D4A017" />
              <path d="M9 18l9-7 9 7v9H9z" fill="none" stroke="#2B0808" strokeWidth="2.4" strokeLinejoin="round" />
              <path d="M15 27v-6h6v6" fill="none" stroke="#2B0808" strokeWidth="2.4" />
            </svg>
            <span className="font-display text-[22px] font-bold">Admin</span>
          </div>
          <button onClick={logout} className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-[#431010] lg:hidden ${adminRing}`}>
            <FaSignOutAlt size={13} aria-hidden="true" /> Logout
          </button>
        </div>
        <nav aria-label="Admin sections" className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:mt-0 lg:flex-col lg:overflow-visible lg:px-0">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              aria-current={section === s.key ? "page" : undefined}
              className={`flex min-h-[44px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-left text-[15px] transition ${adminRing} ${
                section === s.key ? "bg-[#431010] font-semibold text-white" : "font-medium hover:bg-[#431010]"
              }`}
            >
              <s.icon size={13} aria-hidden="true" /> {s.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 hidden border-t border-white/10 pt-4 lg:block">
          <p className="m-0 flex items-center gap-2 px-3 text-xs text-[#F3D9A0]">
            <FaCrown size={11} aria-hidden="true" /> {user.fullName}
          </p>
          <button onClick={logout} className={`mt-2 flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-[15px] font-medium hover:bg-[#431010] ${adminRing}`}>
            <FaSignOutAlt size={13} aria-hidden="true" /> Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-7">
        <p className="m-0 text-sm text-site-muted">Super admin</p>
        <h1 className="m-0 mb-6 mt-0.5 font-display text-[30px] font-bold sm:text-[34px]">
          {section === "overview" ? "Platform overview" : SECTIONS.find((s) => s.key === section)?.label}
        </h1>

        {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}

        {section === "overview" && landlords && (
          <OverviewSection
            landlords={landlords}
            revenue={revenue}
            storageUsage={storageUsage}
            logs={activityLogs}
            onOpenLandlords={() => setSection("landlords")}
          />
        )}

        {section === "landlords" && landlords && (
          <LandlordsSection
            landlords={landlords}
            plans={plans}
            onCreate={() => setLandlordModal({ mode: "create" })}
            onEdit={(l) =>
              setLandlordModal({
                mode: "edit",
                landlord: {
                  name: l.name,
                  email: l.email,
                  phone: l.phone || "",
                  planId: l.planId || "",
                  subscriptionStatus: l.subscriptionStatus,
                  nextBillingDate: l.nextBillingDate?.slice(0, 10) || "",
                  automaticPaymentsEnabled: l.automaticPaymentsEnabled,
                },
              })
            }
            onToggleActive={(l) => setToggleTarget(l)}
            onDelete={(l) => setDeleteTarget(l)}
          />
        )}
        {section === "properties-detail" && landlords && <PropertiesDetailSection landlords={landlords} />}
        {section === "activity-logs" && activityLogs && (
          <ActivityLogsSection
            logs={activityLogs}
            landlords={landlords || []}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            landlordFilter={landlordFilter}
            setLandlordFilter={setLandlordFilter}
          />
        )}
        {section === "revenue" && <RevenueSection revenue={revenue} storageUsage={storageUsage} />}
        {section === "plans" && <PlansSection plans={plans} onEdit={(p) => setPlanModal({ mode: "edit", plan: p })} onCreate={() => setPlanModal({ mode: "create", plan: { name: "", roomLimit: "", price: "" } })} />}
        {section === "transactions" && transactions && <TransactionsSection transactions={transactions} />}
      </main>

      <Modal open={!!landlordModal} title={landlordModal?.mode === "create" ? "Add Landlord" : "Edit Landlord"} onClose={() => setLandlordModal(null)}>
        {landlordModal && (
          <LandlordForm initial={landlordModal.mode === "edit" ? landlordModal.landlord : undefined} plans={plans} onSubmit={handleLandlordSubmit} onCancel={() => setLandlordModal(null)} submitting={submitting} error={formError} />
        )}
      </Modal>

      <Modal open={!!planModal} title={planModal?.mode === "create" ? "Add Plan" : "Edit Plan"} onClose={() => setPlanModal(null)}>
        {planModal && <PlanForm plan={planModal.plan} onSubmit={handlePlanSubmit} onCancel={() => setPlanModal(null)} submitting={submitting} error={formError} />}
      </Modal>

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.subscriptionStatus === "CANCELED" ? "Reactivate this landlord?" : "Deactivate this landlord?"}
        body={
          toggleTarget?.subscriptionStatus === "CANCELED"
            ? "This restores their (and their secretaries') ability to log in."
            : "This blocks the landlord and every secretary under them from logging in at all, until reactivated or the plan is renewed. Use this for support issues or non-payment."
        }
        confirmLabel={toggleTarget?.subscriptionStatus === "CANCELED" ? "Reactivate" : "Deactivate"}
        danger={toggleTarget?.subscriptionStatus !== "CANCELED"}
        onConfirm={handleToggleActive}
        onCancel={() => setToggleTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Permanently delete this landlord?"
        body={`This permanently deletes "${deleteTarget?.name}" and every property, room, tenant, payment, and document under their account. This cannot be undone — deactivate instead if you just want to block access.`}
        confirmLabel="Delete Permanently"
        danger
        onConfirm={handleDeleteLandlord}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
