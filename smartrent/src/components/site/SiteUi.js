import { Link } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// Shared building blocks for the public marketing pages (Home, Features,
// Pricing), matching the RentaFlow website design mockup.

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2";
const lift = "transition-transform duration-200 motion-safe:hover:-translate-y-0.5";

export function SitePage({ children }) {
  return (
    <div className="min-h-screen bg-site-cream font-sans text-site-text">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function Eyebrow({ children, light = false, className = "" }) {
  return (
    <div className={`text-sm font-bold tracking-[0.08em] ${light ? "text-[#F3D9A0]" : "text-[#8A5B00]"} ${className}`}>
      {children}
    </div>
  );
}

const BUTTON_STYLES = {
  primary: "bg-brand-700 text-white",
  outline: "border-[1.5px] border-brand-700 bg-white text-brand-700",
  gold: "bg-gold-500 text-site-text",
  outlineLight: "border-[1.5px] border-white text-white",
};

// Big call-to-action button. `to` = app route; `href` = in-page anchor.
export function SiteButton({ to, href, variant = "primary", className = "", children }) {
  const cls = `inline-flex min-h-[52px] items-center justify-center rounded-[14px] px-7 text-base font-bold ${BUTTON_STYLES[variant]} ${lift} ${ring} ${className}`;
  return href ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}

// Maroon band with a headline and buttons, used at the bottom of each page.
export function CtaBand({ title, children }) {
  return (
    <section className="mt-[88px] bg-brand-700">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 py-14 md:py-16">
        <h2 className="m-0 max-w-[620px] font-display text-[clamp(26px,3.6vw,40px)] font-bold leading-[1.1] text-white">{title}</h2>
        <div className="flex flex-wrap gap-3">{children}</div>
      </div>
    </section>
  );
}

const CHIP = {
  Paid: "bg-[#E3F2E7] text-[#1F6B3A]",
  "Part-paid": "bg-[#FFF1CC] text-[#6B4E00]",
  Overdue: "bg-[#FBE6E6] text-[#8A1C1C]",
  Vacant: "bg-[#EEEAE3] text-[#4A443D]",
  Private: "bg-[#EEEAE3] text-[#4A443D]",
};

export function StatusChip({ status }) {
  return <span className={`whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-semibold ${CHIP[status]}`}>{status}</span>;
}
