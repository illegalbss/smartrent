import { useEffect, useState } from "react";
import { FaBullhorn } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import { TENANT_NAV } from "../../../config/navigation";
import { noticesApi } from "../../../api/notices";

export default function TenantNotices() {
  const [notices, setNotices] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    noticesApi
      .listOwn()
      .then((res) => setNotices(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <DashboardShell navItems={TENANT_NAV} title="Notices" subtitle="Announcements from your landlord">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {notices && notices.length === 0 && (
        <EmptyState icon={FaBullhorn} title="No notices yet" body="Announcements from your landlord or secretary will appear here." />
      )}

      {notices && notices.length > 0 && (
        <div className="space-y-4">
          {notices.map((n) => (
            <Card key={n.id}>
              <div className="text-sm font-bold text-ink-900">{n.title}</div>
              <div className="text-xs text-ink-400">{formatDate(n.createdAt)}</div>
              <p className="mt-3 text-sm text-ink-700">{n.message}</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
