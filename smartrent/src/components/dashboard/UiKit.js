import { useEffect, useRef } from "react";
import AuthImage from "../AuthImage";

// Small dropdown menu (e.g. a row's kebab menu) that closes itself on outside click.
export function ConfirmMenu({ children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-ink-100 bg-white py-1.5 shadow-soft">
      {children}
    </div>
  );
}

// Dashboard look (RentaFlow "Dashboards by Role" design): white cards with
// 18px corners on the cream page, Fraunces headings, muted brown labels.
export function Card({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-[18px] border border-[#EFE6D6] bg-white p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="m-0 font-display text-xl font-bold text-site-text">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, title }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[18px] border border-[#EFE6D6] bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] text-site-muted">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F6E7BC] text-brand-700">
            <Icon size={14} />
          </span>
        )}
      </div>
      <div
        className="mt-1 truncate font-display text-2xl font-bold text-site-text sm:text-[28px]"
        title={title ?? (typeof value === "string" || typeof value === "number" ? String(value) : undefined)}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 truncate text-[13px] text-site-muted">{sub}</div>}
    </div>
  );
}

// Status chip colours from the design spec (all pass 4.5:1 contrast).
export function Badge({ tone = "ink", children }) {
  const tones = {
    ink: "bg-[#EEEAE3] text-[#4A443D]",
    green: "bg-[#E3F2E7] text-[#1F6B3A]",
    amber: "bg-[#FFF1CC] text-[#6B4E00]",
    red: "bg-[#FBE6E6] text-[#8A1C1C]",
    brand: "bg-[#F6E7BC] text-brand-700",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-site-border bg-white/60 py-14 text-center">
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
