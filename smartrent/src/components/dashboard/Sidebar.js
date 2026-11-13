import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { LogoMark } from "../site/SiteLogo";
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

  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

  const content = (
    <div className="flex h-full flex-col text-[#E8DADA]">
      <div className="flex items-center gap-2.5 px-6 pb-4 pt-6 text-white">
        <LogoMark size={34} inverted />
        <span className="font-display text-[22px] font-bold">RentaFlow</span>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-white/[0.07] px-3.5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-site-text">
            {initialsOf(user?.fullName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs text-[#F3D9A0]">{greeting},</div>
            <div className="truncate text-sm font-bold text-white">{user?.fullName}</div>
          </div>
        </div>
        <span className="mt-2 inline-block rounded-full bg-black/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F3D9A0]">
          {user?.role}
        </span>
      </div>

      <nav aria-label="Dashboard" className="flex-1 space-y-1.5 overflow-y-auto px-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[15px] transition ${focusRing} ${
                isActive ? "bg-[#7A2626] font-semibold text-white" : "font-medium text-[#E8DADA] hover:bg-[#6E2020]"
              }`
            }
          >
            <item.icon size={15} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={logout}
          className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium text-[#E8DADA] transition hover:bg-[#6E2020] hover:text-white ${focusRing}`}
        >
          <FaSignOutAlt size={15} aria-hidden="true" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-brand-700 lg:block print:hidden">{content}</aside>

      <button
        onClick={() => setOpen(true)}
        className={`fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl border border-site-border bg-white text-brand-700 lg:hidden print:hidden ${focusRing}`}
        aria-label="Open menu"
      >
        <FaBars size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-brand-700 shadow-soft">
            <button
              onClick={() => setOpen(false)}
              className={`absolute right-3 top-5 flex h-11 w-11 items-center justify-center rounded-xl text-[#E8DADA] hover:text-white ${focusRing}`}
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
