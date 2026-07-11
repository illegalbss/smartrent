import { useEffect, useState } from "react";
import { FaBook, FaTrash } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, formatDate } from "../../../components/dashboard/UiKit";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { STAFF_NAV } from "../../../config/navigation";
import { houseRulesApi } from "../../../api/houseRules";
import { propertiesApi } from "../../../api/properties";

export default function HouseRules() {
  const [rules, setRules] = useState(null);
  const [properties, setProperties] = useState([]);
  const [target, setTarget] = useState(""); // "" = general
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    Promise.all([houseRulesApi.listForStaff(), propertiesApi.list()])
      .then(([rulesRes, propsRes]) => {
        setRules(rulesRes.data);
        setProperties(propsRes.data);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  useEffect(() => {
    if (!rules) return;
    const match = rules.find((r) => (target ? r.propertyId === target : !r.propertyId));
    setContent(match?.content || "");
  }, [target, rules]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      await houseRulesApi.upsert({ content, propertyId: target || undefined });
      setSaveMsg("Saved.");
      load();
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await houseRulesApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      setContent("");
      load();
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  }

  const currentRecord = rules?.find((r) => (target ? r.propertyId === target : !r.propertyId));

  return (
    <DashboardShell navItems={STAFF_NAV} title="House Rules" subtitle="Written rules tenants must follow — general, or specific to one property">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      <Card
        title={target ? `Rules for ${properties.find((p) => p.id === target)?.name || "property"}` : "General Rules (all properties)"}
        action={
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-600 outline-none focus:border-brand-500"
          >
            <option value="">General (All Properties)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        }
      >
        <p className="mb-3 text-xs text-ink-400">
          {target
            ? "This overrides the general rules for tenants at this property only."
            : "Tenants at a property without its own specific rules will see this."}
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="e.g.&#10;1. No pets allowed.&#10;2. No loud music after 10pm.&#10;3. Visitors must sign in at the gate."
          className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        {currentRecord && (
          <p className="mt-2 text-xs text-ink-400">Last updated {formatDate(currentRecord.updatedAt)}</p>
        )}
        {saveMsg && <p className="mt-2 text-sm font-medium text-brand-700">{saveMsg}</p>}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Rules"}
          </button>
          {currentRecord && (
            <button
              onClick={() => setDeleteTarget(currentRecord)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <FaTrash size={12} /> Remove
            </button>
          )}
        </div>
      </Card>

      {rules && rules.length > 0 && (
        <div className="mt-6 flex items-center gap-2 text-xs text-ink-400">
          <FaBook size={11} />
          {rules.length} rule set{rules.length === 1 ? "" : "s"} on file: {rules.map((r) => r.property?.name || "General").join(", ")}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove these rules?"
        body="Tenants covered by this rule set will fall back to the general rules (if any)."
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardShell>
  );
}
