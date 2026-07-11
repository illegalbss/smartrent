import { useEffect, useState } from "react";
import { FaBook } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, EmptyState, formatDate } from "../../../components/dashboard/UiKit";
import { TENANT_NAV } from "../../../config/navigation";
import { houseRulesApi } from "../../../api/houseRules";

export default function TenantHouseRules() {
  const [rules, setRules] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    houseRulesApi
      .getOwn()
      .then((res) => setRules(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <DashboardShell navItems={TENANT_NAV} title="House Rules" subtitle="Rules set by your landlord for your tenancy">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {rules === null && (
        <EmptyState icon={FaBook} title="No house rules published yet" body="Your landlord or secretary hasn't posted any rules." />
      )}

      {rules && (
        <Card title="Rules to Follow">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{rules.content}</p>
          <p className="mt-4 text-xs text-ink-400">Last updated {formatDate(rules.updatedAt)}</p>
        </Card>
      )}
    </DashboardShell>
  );
}
