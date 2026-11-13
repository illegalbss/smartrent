import { NavLink } from "react-router-dom";
import { FaHome, FaReceipt, FaTools, FaCommentDots } from "react-icons/fa";

const TABS = [
  { to: "/dashboard/tenant", label: "Home", icon: FaHome, end: true },
  { to: "/dashboard/tenant/payments", label: "Receipts", icon: FaReceipt },
  { to: "/dashboard/tenant/maintenance", label: "Repairs", icon: FaTools },
  { to: "/dashboard/tenant/complaints", label: "Message", icon: FaCommentDots },
];

// Phone-only bottom tabs for tenants (tenant design). The sidebar menu is
// still there for everything else (notices, house rules, settings).
export default function TenantTabBar() {
  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-site-border bg-white px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 lg:hidden print:hidden"
    >
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
              isActive ? "font-semibold text-brand-700" : "text-site-muted"
            }`
          }
        >
          <t.icon size={19} aria-hidden="true" />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
