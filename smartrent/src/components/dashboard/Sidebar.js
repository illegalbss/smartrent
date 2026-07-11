import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";

function initialsOf(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Sidebar({ navItems }) {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();

  const visibleItems = navItems.filter((item) => !item.landlordOnly || user?.role === "landlord");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const content = (
    <div className="flex h-full flex-col text-brand-50">
      <div className="px-5 py-5">
        <Logo linkTo="#" light />
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-white/5 px-3.5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {initialsOf(user?.fullName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs text-brand-200">{greeting},</div>
            <div className="truncate text-sm font-bold text-white">{user?.fullName}</div>
          </div>
        </div>
        <span className="mt-2 inline-block rounded-full bg-brand-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-300">
          {user?.role}
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive ? "bg-brand-500 text-white shadow-card" : "text-brand-100/80 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-brand-100/80 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <FaSignOutAlt size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-brand-950 lg:block print:hidden">{content}</aside>

      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 shadow-card lg:hidden print:hidden"
        aria-label="Open menu"
      >
        <FaBars size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand-950 shadow-soft">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 text-brand-100 hover:text-white"
              aria-label="Close menu"
            >
              <FaTimes size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
