import { useEffect, useState } from "react";
import { FaTools } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, Badge, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import { STAFF_NAV } from "../../../config/navigation";
import { maintenanceApi } from "../../../api/maintenance";

const STATUS_TONE = { PENDING: "amber", IN_PROGRESS: "brand", COMPLETED: "green" };
const STATUS_LABEL = { PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed" };
const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

export default function Maintenance() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  function load() {
    maintenanceApi
      .listForStaff(filter)
      .then((res) => setRequests(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(load, [filter]);

  async function handleStatusChange(id, status) {
    try {
      await maintenanceApi.updateStatus(id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <DashboardShell navItems={STAFF_NAV} title="Maintenance Requests" subtitle="Repair and maintenance requests raised by tenants">
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
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

      {requests && requests.length === 0 && (
        <EmptyState icon={FaTools} title="No maintenance requests" body="Requests submitted by tenants will show up here." />
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-ink-900">{r.title}</div>
                  <div className="text-xs text-ink-400">
                    {r.tenant.name}
                    {r.tenant.room ? ` — Room ${r.tenant.room.roomNumber}, ${r.tenant.room.property.name}` : ""} ·{" "}
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-700">{r.description}</p>
              <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
                {["PENDING", "IN_PROGRESS", "COMPLETED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(r.id, s)}
                    disabled={r.status === s}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                      r.status === s
                        ? "cursor-default border-ink-100 bg-ink-50 text-ink-400"
                        : "border-ink-200 text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    Mark {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
