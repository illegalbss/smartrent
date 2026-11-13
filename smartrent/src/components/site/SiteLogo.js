import { Link } from "react-router-dom";

// Public-site logo: maroon rounded square with a gold house outline, plus
// the RentaFlow wordmark in Fraunces.
// `inverted` = gold square with a maroon house, for use on maroon (sidebar).
export function LogoMark({ size = 36, inverted = false }) {
  const bg = inverted ? "#D4A017" : "#5C1010";
  const line = inverted ? "#5C1010" : "#D4A017";
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" focusable="false">
      <rect width="36" height="36" rx="10" fill={bg} />
      <path d="M9 18l9-7 9 7v9H9z" fill="none" stroke={line} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M15 27v-6h6v6" fill="none" stroke={line} strokeWidth="2.4" />
    </svg>
  );
}

// `compact` shrinks the logo slightly on phones so the header's buttons fit
// beside it at 360px.
export default function SiteLogo({ to = "/", compact = false }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 sm:gap-2.5"
    >
      <LogoMark size={compact ? 32 : 36} />
      <span className={`font-display font-bold ${compact ? "text-xl sm:text-2xl" : "text-2xl"}`}>RentaFlow</span>
    </Link>
  );
}
