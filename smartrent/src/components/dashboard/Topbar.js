import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell, FaSearch } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { complaintsApi } from "../../api/complaints";
import { maintenanceApi } from "../../api/maintenance";
import { noticesApi } from "../../api/notices";
import { api } from "../../api/client";
import { formatNaira } from "./UiKit";

const REMINDER_WINDOW_DAYS = 7;

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

// "Read" is remembered per user on this device (there is no server-side read
// state). Ids of read items are kept; anything else shows as unread.
function readKey(user) {
  return `rentaflow_read_notifications_${user?.role || "x"}_${user?.id || "x"}`;
}
function loadRead(user) {
  try {
    return new Set(JSON.parse(localStorage.getItem(readKey(user))) || []);
  } catch {
    return new Set();
  }
}
function saveRead(user, set) {
  try {
    // Keep the list from growing forever.
    localStorage.setItem(readKey(user), JSON.stringify([...set].slice(-300)));
  } catch {
    // Storage blocked — read state just won't persist.
  }
}

export default function Topbar({ title, subtitle }) {
  const { isStaff, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => loadRead(user));
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Rent reminders change daily, so they're read per day, not forever.
  const itemKey = (item) => (item.id === "rent-reminder" ? `rent-reminder-${new Date().toDateString()}` : item.id);
  const isRead = (item) => readIds.has(itemKey(item));
  const unreadCount = items.filter((i) => !isRead(i)).length;

  function markRead(list) {
    const next = new Set(readIds);
    list.forEach((i) => next.add(itemKey(i)));
    setReadIds(next);
    saveRead(user, next);
  }
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

  function submitSearch(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/dashboard/staff/tenants?q=${encodeURIComponent(q)}` : "/dashboard/staff/tenants");
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-site-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8 print:hidden">
      <div className="ml-14 min-w-0 flex-1 lg:ml-0">
        {isStaff ? (
          <form onSubmit={submitSearch} role="search" className="relative max-w-xl">
            <label htmlFor="global-search" className="sr-only">
              Search properties, tenants, or rooms
            </label>
            <FaSearch size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-site-muted" aria-hidden="true" />
            <input
              id="global-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search properties, tenants, or rooms…"
              className="min-h-[44px] w-full rounded-full border border-site-border bg-site-cream pl-11 pr-4 text-sm text-site-text outline-none placeholder:text-site-muted focus:border-brand-700 focus:bg-white focus:ring-[3px] focus:ring-[#F0D58A]"
            />
          </form>
        ) : (
          <span className="block truncate font-display text-lg font-bold">{title}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="sr-only">{today}</span>
        <div className="relative" ref={wrapperRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
            aria-expanded={open}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-site-border bg-white text-brand-700 transition hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <FaBell size={15} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8A1C1C] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-site-border bg-white py-2 shadow-soft">
              <div className="flex items-center justify-between gap-2 border-b border-[#F3ECDF] px-4 py-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-site-muted">
                  {isStaff ? "Needs attention" : "Notices & reminders"}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markRead(items)}
                    className="min-h-[36px] rounded px-1 text-xs font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-site-muted">Nothing new right now.</p>
                ) : (
                  items.map((item) => {
                    const read = isRead(item);
                    return (
                      <Link
                        key={item.id}
                        to={item.link}
                        onClick={() => {
                          markRead([item]);
                          setOpen(false);
                        }}
                        className={`flex gap-2.5 px-4 py-2.5 text-sm hover:bg-site-cream ${read ? "" : "bg-[#FBF7F0]"}`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${read ? "bg-transparent" : "bg-[#8A1C1C]"}`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className={`block ${read ? "font-normal text-site-muted" : "font-semibold text-site-text"}`}>
                            {item.text}
                            {!read && <span className="sr-only"> (unread)</span>}
                          </span>
                          <span className="block text-xs text-site-muted">{timeAgo(item.date)}</span>
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <span className="hidden h-8 w-px bg-site-border sm:block" aria-hidden="true" />
        <Link
          to={isStaff ? "/dashboard/staff/settings" : "/dashboard/tenant/settings"}
          className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-1.5 hover:bg-site-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          aria-label={`${user?.fullName || "Your account"} — settings`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-[#F3D9A0]">
            {initials(user?.fullName)}
          </span>
          <span className="hidden min-w-0 text-left md:block">
            <span className="block max-w-[140px] truncate text-sm font-semibold text-site-text">{user?.fullName}</span>
            <span className="block text-xs capitalize text-site-muted">{user?.role}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
