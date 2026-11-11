import { Link } from "react-router-dom";
import { LogoMark } from "./SiteLogo";
import DownloadAppButton from "../DownloadAppButton";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-site-deep";

const LINKS = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/register", label: "Get started" },
  { to: "/login", label: "Log in" },
];

const linkClass = `inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-sm text-[#E8DADA] hover:text-gold-400 ${focusRing}`;

export default function SiteFooter() {
  return (
    <footer className="bg-site-deep text-[#E8DADA]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-12 gap-y-6 px-6 py-10 text-sm">
        <div>
          <div className="flex items-center gap-2.5">
            {/* The mark doubles as the (deliberately unlabelled) Super Admin entrance. */}
            <Link
              to="/admin/login"
              aria-label="RentaFlow"
              className={`-m-2 inline-flex h-11 w-11 items-center justify-center rounded-[10px] ${focusRing}`}
            >
              <LogoMark size={28} />
            </Link>
            <span className="font-display text-xl font-bold text-white">RentaFlow</span>
          </div>
          <p className="mt-1.5">Rent records for Nigerian landlords.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-7">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className={linkClass}>
              {l.label}
            </Link>
          ))}
          <DownloadAppButton className={`${linkClass} gap-2 text-gold-400`} />
        </nav>
      </div>
    </footer>
  );
}
