import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaHome, FaListUl, FaInfoCircle, FaEnvelope } from "react-icons/fa";
import Logo from "./Logo";
import DownloadAppButton from "./DownloadAppButton";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: FaHome, end: true },
  { href: "#features", label: "Features", icon: FaListUl },
  { href: "#about", label: "About", icon: FaInfoCircle },
  { href: "#contact", label: "Contact", icon: FaEnvelope },
];

// Public-site sibling of the dashboard Sidebar (../components/dashboard/Sidebar.js) —
// same dark maroon drawer + mobile hamburger pattern, kept consistent site-wide.
export default function PublicSidebar() {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col text-brand-50">
      <div className="px-5 py-5">
        <Logo linkTo="/" light />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) =>
          item.href ? (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-brand-100/80 transition hover:bg-white/5 hover:text-white"
            >
              <item.icon size={16} />
              {item.label}
            </a>
          ) : (
            <NavLink
              key={item.label}
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
          )
        )}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-3 py-4">
        <DownloadAppButton
          onClick={() => setOpen(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-3.5 py-2.5 text-sm font-bold text-brand-950 transition hover:bg-gold-500"
        />
        <Link
          to="/login"
          onClick={() => setOpen(false)}
          className="block rounded-xl border border-white/15 px-3.5 py-2.5 text-center text-sm font-bold text-brand-50 transition hover:border-white/30 hover:bg-white/5"
        >
          Login
        </Link>
        <Link
          to="/register"
          onClick={() => setOpen(false)}
          className="block rounded-xl bg-brand-500 px-3.5 py-2.5 text-center text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
        >
          Register
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 bg-brand-950 lg:block">{content}</aside>

      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 shadow-card lg:hidden"
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
