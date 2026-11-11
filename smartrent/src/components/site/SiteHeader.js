import { Link, NavLink } from "react-router-dom";
import SiteLogo from "./SiteLogo";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-site-cream";

// "How it works" is a section on Home; the rest are pages.
const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { href: "/#how", label: "How it works" },
];

const linkBase = `inline-flex min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap rounded-lg px-1 text-[13px] sm:px-1.5 sm:text-[15px] lg:px-0 ${focusRing}`;
const idle = "font-medium text-[#4A3A34] hover:text-brand-700";
const logInClass = `${linkBase} font-semibold text-[#4A3A34] hover:text-brand-700`;

// Layout by width:
//  phone (<640): row 1 logo + Get started; row 2 the links, then Log in
//  tablet (640–1023): row 1 logo + Log in + Get started; row 2 the links
//  desktop (1024+): everything on one row
export default function SiteHeader() {
  return (
    <header className="border-b border-site-border bg-site-cream">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-3 px-6 py-2 lg:gap-x-8">
        <SiteLogo compact />

        <nav aria-label="Main" className="order-3 -mx-1 flex w-full flex-wrap sm:-mx-1.5 sm:gap-x-3 lg:order-2 lg:mx-0 lg:w-auto lg:flex-1 lg:gap-x-7">
          {NAV.map((item) =>
            item.href ? (
              <a key={item.label} href={item.href} className={`${linkBase} ${idle}`}>
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `${linkBase} ${isActive ? "font-semibold text-brand-700" : idle}`}
              >
                {item.label}
              </NavLink>
            )
          )}
          <Link to="/login" className={`${logInClass} ml-auto sm:hidden`}>
            Log in
          </Link>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-3 lg:order-3 lg:ml-0">
          <Link to="/login" className={`${logInClass} hidden sm:inline-flex`}>
            Log in
          </Link>
          <Link
            to="/register"
            className={`inline-flex min-h-[44px] items-center whitespace-nowrap rounded-xl bg-brand-700 px-4 text-[15px] font-semibold text-white transition motion-safe:hover:-translate-y-0.5 sm:px-5 ${focusRing}`}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
