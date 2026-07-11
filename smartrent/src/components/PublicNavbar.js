import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import Logo from "./Logo";

const ANCHOR_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className="text-sm font-medium text-ink-600 transition hover:text-brand-600">
            Home
          </NavLink>
          {ANCHOR_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-ink-600 transition hover:text-brand-600">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-700 transition hover:text-brand-600"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
          >
            Register
          </Link>
        </div>

        <button
          className="text-ink-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <NavLink
              to="/"
              end
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
            >
              Home
            </NavLink>
            {ANCHOR_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-ink-100 pt-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-ink-200 px-4 py-2 text-center text-sm font-semibold text-ink-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-brand-500 px-4 py-2 text-center text-sm font-semibold text-white"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
