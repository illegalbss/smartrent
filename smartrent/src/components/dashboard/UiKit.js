import AuthImage from "../AuthImage";

export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-7 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-bold text-ink-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, title }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon size={14} />
          </span>
        )}
      </div>
      <div
        className="mt-2 truncate text-xl font-extrabold text-ink-900 sm:text-2xl"
        title={title ?? (typeof value === "string" || typeof value === "number" ? String(value) : undefined)}
      >
        {value}
      </div>
      {sub && <div className="mt-1 truncate text-xs text-ink-400">{sub}</div>}
    </div>
  );
}

export function Badge({ tone = "ink", children }) {
  const tones = {
    ink: "bg-ink-100 text-ink-600",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    brand: "bg-brand-100 text-brand-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-400">
          <Icon size={20} />
        </span>
      )}
      <h3 className="mt-4 text-sm font-bold text-ink-800">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function initialsOf(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// entity needs { name, hasPhoto } and photoSrc is the authenticated GET path for its photo.
export function Avatar({ entity, photoSrc, size = "h-12 w-12 text-base" }) {
  const initials = (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700`}>
      {initialsOf(entity.name)}
    </div>
  );
  if (!entity.hasPhoto) return initials;
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full bg-brand-100`}>
      <AuthImage src={photoSrc} alt={entity.name} className="h-full w-full object-cover" fallback={initials} />
    </div>
  );
}

export function formatNaira(amount) {
  if (amount === null || amount === undefined || amount === "") return "—";
  return `₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

// Short form for tight spaces (stat tiles) — pair with formatNaira as a title/tooltip for the exact figure.
export function formatNairaCompact(amount) {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `₦${(n / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `₦${(n / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}

export function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}
