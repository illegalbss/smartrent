import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { LogoMark } from "../site/SiteLogo";
import { useAuth } from "../../context/AuthContext";
import { complaintsApi } from "../../api/complaints";

export default function Sidebar({ navItems }) {
  const [open, setOpen] = useState(false);
  const { logout, user, isStaff } = useAuth();
  const [badges, setBadges] = useState({});

  const visibleItems = navItems.filter((item) => !item.landlordOnly || user?.role === "landlord");
  const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

  // Live counts for items that ask for one (e.g. open messages).
  const wantsComplaints = isStaff && navItems.some((i) => i.badge === "openComplaints");
  useEffect(() => {
    if (!wantsComplaints) return;
    let cancelled = false;
    complaintsApi
      .listForStaff("OPEN")
      .then((res) => !cancelled && setBadges({ openComplaints: res.data.length }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wantsComplaints]);

  const content = (
    <div className="flex h-full flex-col text-[#E8DADA]">
      <div className="flex flex-col items-center px-6 pb-5 pt-7 text-center text-white">
        <LogoMark size={48} inverted />
        <span className="mt-2 font-display text-[26px] font-bold leading-none">Rentaflow</span>
        <span className="mt-1.5 text-xs text-[#F3D9A0]">Manage • Track • Collect</span>
      </div>

      <nav aria-label="Dashboard" className="flex-1 space-y-1 overflow-y-auto px-4">
        {visibleItems.map((item) => {
          const count = item.badge ? badges[item.badge] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[15px] transition ${focusRing} ${
                  isActive ? "bg-[#7A2626] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]" : "font-medium text-[#E8DADA] hover:bg-[#6E2020]"
                }`
              }
            >
              <item.icon size={16} aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gold-500 px-1.5 text-xs font-bold text-site-text" aria-label={`${count} open`}>
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 pb-4 pt-3">
        <button
          onClick={logout}
          className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium text-[#E8DADA] transition hover:bg-[#6E2020] hover:text-white ${focusRing}`}
        >
          <FaSignOutAlt size={15} aria-hidden="true" />
          Logout
        </button>
        <p className="m-0 mt-2 text-center text-xs text-[#E8DADA]/80">Rentaflow © {new Date().getFullYear()}</p>
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
