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
  FaMoneyBillWave,
  FaReceipt,
  FaFileInvoiceDollar,
  FaPrint,
  FaBell,
  FaHome,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, Avatar, StatCard, formatDate, formatNaira, formatNairaCompact } from "../../../components/dashboard/UiKit";
import { IncomeOverviewChart, MonthlyCollectionsChart, PaymentStatusChart } from "../../../components/dashboard/FinanceCharts";
import Modal from "../../../components/Modal";
import ConfirmDialog from "../../../components/ConfirmDialog";
import FormField from "../../../components/FormField";
import { STAFF_NAV } from "../../../config/navigation";
import { tenantsApi } from "../../../api/tenants";
import { propertiesApi, roomsApi } from "../../../api/properties";
import { paymentsApi } from "../../../api/payments";
import { documentsApi } from "../../../api/documents";
import { complaintsApi } from "../../../api/complaints";
import { noticesApi } from "../../../api/notices";
import { secretariesApi } from "../../../api/secretaries";
import { useAuth } from "../../../context/AuthContext";

const DOC_TYPES = [
  { value: "REFEREE_FORM", label: "Referee Form" },
  { value: "GOVERNMENT_ID", label: "Government-Issued ID" },
  { value: "PERSONAL_INFO_SHEET", label: "Personal Information Sheet" },
  { value: "UTILITY_BILL", label: "Utility Bill" },
  { value: "INSPECTION_REPORT", label: "Inspection Report" },
  { value: "OTHER", label: "Other" },
];

const TABS = ["Overview", "Payments", "Financial Reports", "Complaints", "Documents", "Lease Info"];

const PRIORITY_TONE = { LOW: "ink", MEDIUM: "amber", HIGH: "red" };

function leaseStatus(tenant) {
  if (!tenant.dateExpiration) return { label: "No Lease End Set", tone: "ink" };
  const days = Math.ceil((new Date(tenant.dateExpiration).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", tone: "red" };
  if (days <= 60) return { label: "Expiring Soon", tone: "amber" };
  return { label: "Active", tone: "green" };
}

function TenantEditForm({ tenant, onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({
    name: tenant.name,
    phone: tenant.phone || "",
    dateCommencement: tenant.dateCommencement?.slice(0, 10) || "",
    dateExpiration: tenant.dateExpiration?.slice(0, 10) || "",
    dateRenewal: tenant.dateRenewal?.slice(0, 10) || "",
    securityDeposit: tenant.securityDeposit || "",
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
        onSubmit({ ...form, roomId: form.roomId || null, securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : null });
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
      <FormField
        label="Security Deposit (₦, optional)"
        name="securityDeposit"
        type="number"
        value={form.securityDeposit}
        onChange={(e) => setForm((f) => ({ ...f, securityDeposit: e.target.value }))}
      />
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

function OverviewTab({ tenant }) {
  const ps = tenant.paymentStatus;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Total Rent" value={tenant.room ? formatNairaCompact(tenant.room.rentAmount) : "—"} title={tenant.room ? formatNaira(tenant.room.rentAmount) : undefined} icon={FaHome} sub="per annum" />
      <StatCard label="Amount Paid" value={formatNairaCompact(tenant.finance.totalCollected)} title={formatNaira(tenant.finance.totalCollected)} icon={FaCheckCircle} />
      <StatCard label="Outstanding Balance" value={formatNairaCompact(ps.outstanding)} title={formatNaira(ps.outstanding)} icon={FaMoneyBillWave} />
      <StatCard
        label="Last Payment"
        value={tenant.payments[0] ? formatNairaCompact(tenant.payments[0].amount) : "—"}
        title={tenant.payments[0] ? formatNaira(tenant.payments[0].amount) : undefined}
        icon={FaCalendarAlt}
        sub={tenant.payments[0] ? formatDate(tenant.payments[0].datePaid) : "No payments yet"}
      />
      <StatCard label="Next Payment Due" value={ps.nextDueDate ? formatDate(ps.nextDueDate) : "—"} icon={FaCalendarAlt} sub={ps.isOverdue ? `${Math.abs(ps.daysUntilDue)}d overdue` : ps.daysUntilDue !== null ? `in ${ps.daysUntilDue}d` : ""} />
      <StatCard
        label="Payment Status"
        value={ps.lastPaymentStatus ? ps.lastPaymentStatus : "NO PAYMENTS"}
        icon={FaMoneyBillWave}
      />
    </div>
  );
}

function PaymentsTab({ tenant, tenantId, onAdd, onEdit, onDelete }) {
  return (
    <Card
      title="Payment History"
      action={
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600">
          <FaPlus size={11} /> Record Payment
        </button>
      }
    >
      {tenant.payments.length === 0 ? (
        <p className="text-sm text-ink-400">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-ink-100 text-xs font-bold uppercase text-ink-400">
              <tr>
                <th className="py-2 pr-4">Receipt No.</th>
                <th className="py-2 pr-4">Date Paid</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tenant.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-4 font-mono text-xs text-ink-500">{p.id.slice(-8).toUpperCase()}</td>
                  <td className="py-2.5 pr-4">{formatDate(p.datePaid)}</td>
                  <td className="py-2.5 pr-4 font-semibold text-ink-800">{formatNaira(p.amount)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={p.source === "PAYSTACK" ? "brand" : "ink"}>{p.source === "PAYSTACK" ? "Paystack" : "Manual"}</Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={p.status === "PAID" ? "green" : p.status === "PARTIAL" ? "amber" : "red"}>{p.status}</Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => paymentsApi.downloadReceipt(tenantId, p.id, `Receipt-${p.id.slice(-8)}.pdf`)}
                        className="text-ink-400 hover:text-brand-600"
                        title="Download Receipt"
                      >
                        <FaFileDownload size={13} />
                      </button>
                      <button onClick={() => onEdit(p)} className="text-ink-400 hover:text-brand-600" title="Edit">
                        <FaEdit size={13} />
                      </button>
                      <button onClick={() => onDelete(p)} className="text-ink-400 hover:text-red-600" title="Delete">
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
  );
}

function computeYearlyReport(payments, year, rentAmount, month) {
  const inYear = payments.filter((p) => new Date(p.datePaid).getFullYear() === year);
  const inScope = month === "ALL" ? inYear : inYear.filter((p) => new Date(p.datePaid).getMonth() === Number(month));

  const byStatus = { PAID: { count: 0, total: 0 }, PARTIAL: { count: 0, total: 0 }, OWING: { count: 0, total: 0 } };
  for (const p of inScope) {
    byStatus[p.status].count += 1;
    byStatus[p.status].total += Number(p.amount);
  }
  const totalCollected = byStatus.PAID.total + byStatus.PARTIAL.total;
  const totalOwing = byStatus.OWING.total;

  const monthlySeries = Array.from({ length: 12 }, (_, i) => {
    const label = new Date(Date.UTC(year, i, 1)).toLocaleDateString("en-NG", { month: "short", timeZone: "UTC" });
    const total = inYear
      .filter((p) => {
        const d = new Date(p.datePaid);
        return d.getUTCMonth() === i && p.status !== "OWING";
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { month: label, total };
  });

  return {
    totalExpected: rentAmount,
    totalCollected,
    totalOwing,
    collectionRate: totalCollected + totalOwing > 0 ? Math.round((totalCollected / (totalCollected + totalOwing)) * 1000) / 10 : 0,
    byStatus,
    monthlySeries,
  };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function FinancialReportsTab({ tenant }) {
  const years = Array.from(new Set([new Date().getFullYear(), ...tenant.payments.map((p) => new Date(p.datePaid).getFullYear())])).sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]);
  const [month, setMonth] = useState("ALL");

  const report = computeYearlyReport(tenant.payments, year, tenant.room?.rentAmount || 0, month);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-ink-400">Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-semibold text-ink-700 outline-none focus:border-brand-500">
              <option value="ALL">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <button className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600">Generate Report</button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Expected" value={formatNairaCompact(report.totalExpected)} title={formatNaira(report.totalExpected)} icon={FaHome} />
        <StatCard label="Total Collected" value={formatNairaCompact(report.totalCollected)} title={formatNaira(report.totalCollected)} icon={FaCheckCircle} />
        <StatCard label="Outstanding" value={formatNairaCompact(report.totalOwing)} title={formatNaira(report.totalOwing)} icon={FaMoneyBillWave} />
        <StatCard label="Collection Rate" value={`${report.collectionRate}%`} icon={FaFileInvoiceDollar} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MonthlyCollectionsChart series={report.monthlySeries} />
        <PaymentStatusChart byStatus={report.byStatus} />
      </div>
      <IncomeOverviewChart series={report.monthlySeries} className="" />
    </div>
  );
}

function ComplaintForm({ onSubmit, onCancel, submitting, error }) {
  const [form, setForm] = useState({ message: "", category: "", priority: "MEDIUM" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
      <FormField label="Complaint" name="message" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
      <FormField label="Category (optional)" name="category" placeholder="e.g. Plumbing, Electrical" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-semibold text-ink-700">Priority</label>
        <div className="grid grid-cols-3 gap-2">
          {["LOW", "MEDIUM", "HIGH"].map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setForm((f) => ({ ...f, priority: p }))}
              className={`rounded-xl border py-2 text-xs font-bold transition ${form.priority === p ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:border-brand-300"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">Cancel</button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Logging…" : "Log Complaint"}
        </button>
      </div>
    </form>
  );
}

function TriageForm({ complaint, staffOptions, onSubmit, onResolve, submitting, error }) {
  const [form, setForm] = useState({
    priority: complaint.priority,
    category: complaint.category || "",
    assignedToId: complaint.assignedToId || "",
  });
  const [response, setResponse] = useState(complaint.response || "");

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {["LOW", "MEDIUM", "HIGH"].map((p) => (
              <button type="button" key={p} onClick={() => setForm((f) => ({ ...f, priority: p }))} className={`rounded-xl border py-2 text-xs font-bold transition ${form.priority === p ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <FormField label="Category" name="category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Assign To</label>
          <select
            value={form.assignedToId}
            onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}
            className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-900 outline-none focus:border-brand-500 focus:bg-white"
          >
            <option value="">Unassigned</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="mb-4 text-sm font-medium text-red-500">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
          {submitting ? "Saving…" : "Save Triage"}
        </button>
      </form>

      {complaint.status === "OPEN" && (
        <div className="mt-5 border-t border-ink-100 pt-5">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Resolution Response</label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            className="mb-3 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white"
            placeholder="How was this resolved?"
          />
          <button
            onClick={() => onResolve(response)}
            disabled={!response.trim() || submitting}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
}

function ComplaintsTab({ tenantId, onNewComplaint }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [triageTarget, setTriageTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    complaintsApi.listForStaff({ tenantId }).then((res) => setComplaints(res.data)).catch(() => {});
  }
  useEffect(load, [tenantId]);

  useEffect(() => {
    const self = user.role === "landlord" ? [{ id: user.id, name: `${user.fullName} (You)` }] : [];
    secretariesApi
      .list()
      .then((res) => setStaffOptions([...self, ...res.data.map((s) => ({ id: s.id, name: s.name }))]))
      .catch(() => setStaffOptions(self));
  }, [user]);

  async function handleTriage(form) {
    setSubmitting(true);
    setError("");
    try {
      const staffMember = staffOptions.find((s) => s.id === form.assignedToId);
      await complaintsApi.updateTriage(triageTarget.id, {
        priority: form.priority,
        category: form.category || null,
        assignedToId: form.assignedToId || null,
        assignedToRole: form.assignedToId === user.id ? user.role.toUpperCase() : form.assignedToId ? "SECRETARY" : undefined,
        assignedToName: staffMember?.name.replace(" (You)", "") || null,
      });
      setTriageTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(response) {
    setSubmitting(true);
    setError("");
    try {
      await complaintsApi.respond(triageTarget.id, response);
      setTriageTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      title="Complaints"
      action={
        <button onClick={onNewComplaint} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600">
          <FaPlus size={11} /> New Complaint
        </button>
      }
    >
      {complaints && complaints.length === 0 && <p className="text-sm text-ink-400">No complaints logged for this tenant.</p>}
      {complaints && complaints.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-ink-100 text-xs font-bold uppercase text-ink-400">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Complaint</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 pr-4">Assigned</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Resolved</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 pr-4 text-ink-500">{formatDate(c.createdAt)}</td>
                  <td className="max-w-xs truncate py-2.5 pr-4 text-ink-700">{c.message}</td>
                  <td className="py-2.5 pr-4 text-ink-500">{c.category || "—"}</td>
                  <td className="py-2.5 pr-4"><Badge tone={PRIORITY_TONE[c.priority]}>{c.priority}</Badge></td>
                  <td className="py-2.5 pr-4 text-ink-500">{c.assignedToName || "Unassigned"}</td>
                  <td className="py-2.5 pr-4"><Badge tone={c.status === "OPEN" ? "amber" : "green"}>{c.status}</Badge></td>
                  <td className="py-2.5 pr-4 text-ink-500">{c.respondedAt ? formatDate(c.respondedAt) : "—"}</td>
                  <td className="py-2.5 pr-4">
                    <button onClick={() => setTriageTarget(c)} className="text-xs font-bold text-brand-600 hover:text-brand-700">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!triageTarget} title="Manage Complaint" onClose={() => setTriageTarget(null)}>
        {triageTarget && (
          <TriageForm complaint={triageTarget} staffOptions={staffOptions} onSubmit={handleTriage} onResolve={handleResolve} submitting={submitting} error={error} />
        )}
      </Modal>
    </Card>
  );
}

function DocumentsTab({ tenant, uploadForm, setUploadForm, onUpload, formError, submitting, onGenerateAgreement, onDeleteDocument }) {
  return (
    <Card
      title="Documents"
      action={
        <button
          onClick={onGenerateAgreement}
          disabled={!tenant.room}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          title={!tenant.room ? "Assign a room before generating an agreement" : ""}
        >
          <FaFileContract size={11} /> Generate Tenancy Agreement
        </button>
      }
    >
      <form onSubmit={onUpload} className="mb-5 flex flex-col gap-3 rounded-xl bg-ink-50 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-ink-700">Document Type</label>
          <select
            value={uploadForm.type}
            onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
                <button onClick={() => onDeleteDocument(d.id)} className="text-ink-400 hover:text-red-600" title="Delete">
                  <FaTrash size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function LeaseInfoTab({ tenant }) {
  const status = leaseStatus(tenant);
  return (
    <Card title="Lease Information">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Lease Start Date</div>
          <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(tenant.dateCommencement)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Lease End Date</div>
          <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(tenant.dateExpiration)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Rent Amount</div>
          <div className="mt-1 text-sm font-semibold text-ink-800">{tenant.room ? `${formatNaira(tenant.room.rentAmount)} / year` : "—"}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Security Deposit</div>
          <div className="mt-1 text-sm font-semibold text-ink-800">{tenant.securityDeposit ? formatNaira(tenant.securityDeposit) : "Not recorded"}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Payment Frequency</div>
          <div className="mt-1 text-sm font-semibold text-ink-800">Annual</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Renewal Date</div>
          <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(tenant.dateRenewal)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-ink-400">Lease Status</div>
          <div className="mt-1"><Badge tone={status.tone}>{status.label}</Badge></div>
        </div>
      </div>
    </Card>
  );
}

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [editModal, setEditModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [uploadForm, setUploadForm] = useState({ type: "OTHER", file: null });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [offboardConfirm, setOffboardConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [complaintModal, setComplaintModal] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderText, setReminderText] = useState("");

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

  async function handleDeleteTenant() {
    try {
      await tenantsApi.remove(id);
      navigate("/dashboard/staff/tenants");
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(false);
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

  async function handleNewComplaint(form) {
    setSubmitting(true);
    setFormError("");
    try {
      await complaintsApi.createForTenant(id, form);
      setComplaintModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openReminderModal() {
    const ps = tenant.paymentStatus;
    const text = ps.isOverdue
      ? `Hi ${tenant.name}, your rent was due on ${formatDate(ps.nextDueDate)} and is now ${Math.abs(ps.daysUntilDue)} day(s) overdue. Outstanding balance: ${formatNaira(ps.outstanding)}. Please make payment as soon as possible.`
      : ps.nextDueDate
      ? `Hi ${tenant.name}, this is a reminder that your rent of ${tenant.room ? formatNaira(tenant.room.rentAmount) : ""} is due on ${formatDate(ps.nextDueDate)}. Please plan to make payment on time.`
      : `Hi ${tenant.name}, please reach out regarding your rent payment status.`;
    setReminderText(text);
    setReminderModal(true);
  }

  async function handleSendReminder() {
    setSubmitting(true);
    setError("");
    try {
      await noticesApi.create({ tenantId: id, severity: "WARNING", title: "Rent Payment Reminder", message: reminderText });
      setReminderModal(false);
      setActionMsg("Reminder sent — the tenant will see it in their Notices and notification bell.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar entity={tenant} photoSrc={tenantsApi.photoUrl(tenant.id)} size="h-16 w-16 text-xl" />
                <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-ink-900 text-white hover:bg-ink-800">
                  <FaCamera size={10} />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
                </label>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-ink-900">{tenant.name}</h2>
                  <Badge tone={tenant.inviteAcceptedAt ? "green" : "amber"}>{tenant.inviteAcceptedAt ? "Active Tenant" : "Invite Pending"}</Badge>
                </div>
                <p className="text-xs text-ink-400">
                  {tenant.room ? `Room ${tenant.room.roomNumber}, ${tenant.room.property.name}` : "Unassigned"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-500">
                  <span>{tenant.phone || "No phone"}</span>
                  <span>{tenant.email}</span>
                  <span>Move-in: {formatDate(tenant.dateCommencement)}</span>
                  <span>Lease End: {formatDate(tenant.dateExpiration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPaymentModal({ mode: "add" })} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600">
              <FaMoneyBillWave size={12} /> Record Payment
            </button>
            <button
              onClick={() => tenant.payments[0] && paymentsApi.downloadReceipt(id, tenant.payments[0].id, `Receipt-${tenant.name}.pdf`)}
              disabled={!tenant.payments[0]}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
            >
              <FaReceipt size={12} /> Generate Receipt
            </button>
            <button
              onClick={() => paymentsApi.downloadInvoice(id, `Invoice-${tenant.name}.pdf`)}
              disabled={!tenant.room}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
            >
              <FaFileInvoiceDollar size={12} /> Generate Invoice
            </button>
            <button
              onClick={() => paymentsApi.downloadStatement(id, `Statement-${tenant.name}.pdf`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600"
            >
              <FaPrint size={12} /> Print Statement
            </button>
            <button onClick={openReminderModal} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600">
              <FaBell size={12} /> Send Reminder
            </button>
            <button onClick={() => setEditModal(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600">
              <FaEdit size={12} /> Edit Tenant
            </button>
            {tenant.room && (
              <button onClick={() => setOffboardConfirm(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50">
                <FaSignOutAlt size={12} /> Terminate Lease
              </button>
            )}
            <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
              <FaTrash size={12} /> Delete Tenant
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-ink-100">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                  activeTab === t ? "border-brand-500 text-brand-600" : "border-transparent text-ink-400 hover:text-ink-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && <OverviewTab tenant={tenant} />}
          {activeTab === "Payments" && (
            <PaymentsTab
              tenant={tenant}
              tenantId={id}
              onAdd={() => setPaymentModal({ mode: "add" })}
              onEdit={(p) => setPaymentModal({ mode: "edit", payment: p })}
              onDelete={(p) => setDeletePayment(p)}
            />
          )}
          {activeTab === "Financial Reports" && <FinancialReportsTab tenant={tenant} />}
          {activeTab === "Complaints" && <ComplaintsTab tenantId={id} onNewComplaint={() => setComplaintModal(true)} />}
          {activeTab === "Documents" && (
            <DocumentsTab
              tenant={tenant}
              uploadForm={uploadForm}
              setUploadForm={setUploadForm}
              onUpload={handleUpload}
              formError={formError}
              submitting={submitting}
              onGenerateAgreement={handleGenerateAgreement}
              onDeleteDocument={handleDeleteDocument}
            />
          )}
          {activeTab === "Lease Info" && <LeaseInfoTab tenant={tenant} />}
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

      <Modal open={complaintModal} title="Log a Complaint" onClose={() => setComplaintModal(false)}>
        <ComplaintForm onSubmit={handleNewComplaint} onCancel={() => setComplaintModal(false)} submitting={submitting} error={formError} />
      </Modal>

      <Modal open={reminderModal} title="Send Rent Reminder" onClose={() => setReminderModal(false)}>
        <p className="mb-3 text-xs text-ink-500">
          This posts a Notice the tenant will see in their dashboard and notification bell — edit the message before sending if needed.
        </p>
        <textarea
          value={reminderText}
          onChange={(e) => setReminderText(e.target.value)}
          rows={5}
          className="mb-4 w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white"
        />
        {error && <p className="mb-3 text-sm font-medium text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setReminderModal(false)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-bold text-ink-600 hover:bg-ink-50">Cancel</button>
          <button onClick={handleSendReminder} disabled={submitting} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60">
            {submitting ? "Sending…" : "Send Reminder"}
          </button>
        </div>
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
        title="Terminate this lease?"
        body="This will vacate their room and unlink them from it. Their record, payments, and documents are kept."
        confirmLabel="Terminate Lease"
        danger
        onConfirm={handleOffboard}
        onCancel={() => setOffboardConfirm(false)}
      />

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete this tenant?"
        body={`This permanently removes "${tenant?.name}" — use this to correct a registration mistake. Tenants with payment or document history can't be deleted; terminate the lease instead.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteTenant}
        onCancel={() => setDeleteConfirm(false)}
      />
    </DashboardShell>
  );
}
