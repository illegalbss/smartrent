import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { complaintsApi } from "../../api/complaints";
import { maintenanceApi } from "../../api/maintenance";
import { noticesApi } from "../../api/notices";
import { api } from "../../api/client";
import { formatNaira } from "./UiKit";

const REMINDER_WINDOW_DAYS = 7;

function rentReminderItem(paymentStatus) {
  if (!paymentStatus?.nextDueDate || paymentStatus.daysUntilDue > REMINDER_WINDOW_DAYS) return null;
  const text = paymentStatus.isOverdue
    ? `Rent is overdue by ${Math.abs(paymentStatus.daysUntilDue)} day(s) — ${formatNaira(paymentStatus.outstanding)} outstanding`
    : paymentStatus.daysUntilDue === 0
    ? "Rent is due today"
    : `Rent is due in ${paymentStatus.daysUntilDue} day(s)`;
  return { id: "rent-reminder", text, link: "/dashboard/tenant", date: new Date().toISOString() };
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function Topbar({ title, subtitle }) {
  const { isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const wrapperRef = useRef(null);
  const today = new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (isStaff) {
          const [complaints, maintenance] = await Promise.all([
            complaintsApi.listForStaff("OPEN"),
            maintenanceApi.listForStaff("PENDING"),
          ]);
          if (cancelled) return;
          const combined = [
            ...complaints.data.map((c) => ({
              id: `c-${c.id}`,
              text: `New complaint from ${c.tenant.name}`,
              link: "/dashboard/staff/complaints",
              date: c.createdAt,
            })),
            ...maintenance.data.map((m) => ({
              id: `m-${m.id}`,
              text: `Maintenance request: ${m.title} (${m.tenant.name})`,
              link: "/dashboard/staff/maintenance",
              date: m.createdAt,
            })),
          ].sort((a, b) => new Date(b.date) - new Date(a.date));
          setItems(combined);
        } else {
          const [notices, profile] = await Promise.all([noticesApi.listOwn(), api.get("/tenant/profile")]);
          if (cancelled) return;
          const noticeItems = notices.data.slice(0, 8).map((n) => ({
            id: `n-${n.id}`,
            text: n.title,
            link: "/dashboard/tenant/notices",
            date: n.createdAt,
          }));
          const reminder = rentReminderItem(profile.data.paymentStatus);
          setItems(reminder ? [reminder, ...noticeItems] : noticeItems);
        }
      } catch {
        // Notification bell is a convenience — a failed fetch shouldn't block the page.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-site-border bg-site-cream/95 px-6 py-4 backdrop-blur lg:px-8 print:hidden">
      <div className="ml-12 min-w-0 lg:ml-0">
        {subtitle && <p className="m-0 truncate text-[13px] text-site-muted sm:text-sm">{subtitle}</p>}
        <h1 className="m-0 truncate font-display text-xl font-bold text-site-text sm:text-[28px] sm:leading-tight">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden min-h-[44px] items-center rounded-xl border border-site-border bg-white px-4 text-sm font-semibold text-site-text sm:inline-flex">
          {today}
        </span>
        <div className="relative" ref={wrapperRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={`Notifications${items.length ? ` (${items.length})` : ""}`}
            aria-expanded={open}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-site-border bg-white text-brand-700 transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <FaBell size={15} />
            {items.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8A1C1C] px-1 text-[10px] font-bold text-white">
                {items.length > 9 ? "9+" : items.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-20 w-80 rounded-xl border border-ink-100 bg-white py-2 shadow-soft">
              <div className="border-b border-ink-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink-400">
                {isStaff ? "Open items needing attention" : "Notices & Reminders"}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-400">Nothing new right now.</p>
                ) : (
                  items.map((item) => (
                    <Link
                      key={item.id}
                      to={item.link}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-ink-50"
                    >
                      <div className="font-semibold text-ink-800">{item.text}</div>
                      <div className="text-xs text-ink-400">{timeAgo(item.date)}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
