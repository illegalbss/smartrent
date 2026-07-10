import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ navItems }) {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();

  const visibleItems = navItems.filter((item) => !item.landlordOnly || user?.role === "landlord");

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo linkTo="#" />
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
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
              }`
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-100 px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <FaSignOutAlt size={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-ink-100 bg-white lg:block print:hidden">
        {content}
      </aside>

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
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-soft">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 text-ink-400 hover:text-ink-700"
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
