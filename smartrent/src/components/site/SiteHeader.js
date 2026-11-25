import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import SiteLogo from "./SiteLogo";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-site-cream";

// "How it works" is a section on Home; the rest are pages.
const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/features", label: "Features" },
  { href: "/#how", label: "How it works" },
];

const pill = `inline-flex min-h-[40px] items-center whitespace-nowrap rounded-full px-4 text-[15px] transition-colors ${focusRing}`;
const pillIdle = "font-medium text-[#4A3A34] hover:bg-[#F6E7BC] hover:text-brand-700";
const pillActive = "bg-brand-700 font-semibold text-white";

const getStarted = `inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-brand-700 px-5 text-[15px] font-semibold text-white shadow-[0_6px_16px_rgba(92,16,16,0.25)] transition motion-safe:hover:-translate-y-0.5 hover:bg-brand-800 ${focusRing}`;

function NavItems({ onPick, mobile = false }) {
  const base = mobile
    ? `flex min-h-[52px] items-center rounded-xl px-4 text-[17px] transition-colors ${focusRing}`
    : pill;
  const idle = mobile ? "font-medium text-site-text hover:bg-[#F6E7BC]" : pillIdle;
  const active = mobile ? "bg-brand-700 font-semibold text-white" : pillActive;
  return NAV.map((item) =>
    item.href ? (
      <a key={item.label} href={item.href} onClick={onPick} className={`${base} ${idle}`}>
        {item.label}
      </a>
    ) : (
      <NavLink
        key={item.label}
        to={item.to}
        end={item.end}
        onClick={onPick}
        className={({ isActive }) => `${base} ${isActive ? active : idle}`}
      >
        {item.label}
      </NavLink>
    )
  );
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the phone menu on navigation and with Escape.
  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? "border-site-border bg-site-cream/95 shadow-[0_6px_20px_rgba(60,10,10,0.08)] backdrop-blur"
          : "border-transparent bg-site-cream"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-4 sm:px-6">
        <SiteLogo compact />

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 rounded-full border border-site-border bg-white/80 p-1 md:flex">
          <NavItems />
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            to="/login"
            className={`hidden min-h-[44px] items-center rounded-full px-4 text-[15px] font-semibold text-brand-700 hover:bg-[#F6E7BC] sm:inline-flex ${focusRing}`}
          >
            Log in
          </Link>
          <Link to="/register" className={getStarted}>
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-site-border bg-white text-brand-700 md:hidden ${focusRing}`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-site-border bg-site-cream px-4 pb-5 pt-3 motion-safe:animate-[menu-down_200ms_ease-out] md:hidden">
          <nav aria-label="Main" className="flex flex-col gap-1">
            <NavItems mobile onPick={() => setOpen(false)} />
          </nav>
          <Link
            to="/login"
            className={`mt-3 flex min-h-[52px] items-center justify-center rounded-xl border-[1.5px] border-brand-700 text-[17px] font-semibold text-brand-700 ${focusRing}`}
          >
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}
