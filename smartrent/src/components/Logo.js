import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Logo({ light = false, linkTo = "/" }) {
  return (
    <Link to={linkTo} className="flex items-center gap-2 select-none">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-card">
        <FaHome size={18} />
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>
        Smart<span className="text-brand-500">Rent</span>
      </span>
    </Link>
  );
}
