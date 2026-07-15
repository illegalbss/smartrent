import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

// `iconLinkTo` lets the icon and wordmark link to different places — used in
// the footer so the house icon is a deliberately low-visibility entrance to
// the Super Admin login, while the wordmark still just goes home.
export default function Logo({ light = false, linkTo = "/", iconLinkTo }) {
  const icon = (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-gold-400 shadow-card ring-1 ring-gold-500/40">
      <FaHome size={18} />
    </span>
  );
  const wordmark = (
    <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>
      Renta<span className="text-gold-600">Flow</span>
    </span>
  );

  if (iconLinkTo) {
    return (
      <span className="flex items-center gap-2 select-none">
        <Link to={iconLinkTo}>{icon}</Link>
        <Link to={linkTo}>{wordmark}</Link>
      </span>
    );
  }

  return (
    <Link to={linkTo} className="flex items-center gap-2 select-none">
      {icon}
      {wordmark}
    </Link>
  );
}
