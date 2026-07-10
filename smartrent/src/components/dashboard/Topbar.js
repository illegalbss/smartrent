import { FaBell } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const initials = (user?.fullName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/90 px-6 py-4 backdrop-blur lg:px-8 print:hidden">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-lg font-extrabold text-ink-900 sm:text-xl">{title}</h1>
        {subtitle && <p className="text-xs text-ink-400 sm:text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition hover:border-brand-300 hover:text-brand-600">
          <FaBell size={15} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-ink-900">{user?.fullName}</div>
            <div className="text-xs capitalize text-ink-400">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
