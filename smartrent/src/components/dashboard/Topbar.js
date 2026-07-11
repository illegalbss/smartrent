import { FaBell } from "react-icons/fa";

export default function Topbar({ title, subtitle }) {
  const today = new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white/90 px-6 py-4 backdrop-blur lg:px-8 print:hidden">
      <div className="ml-12 lg:ml-0">
        <h1 className="text-lg font-extrabold text-ink-900 sm:text-xl">{title}</h1>
        {subtitle && <p className="text-xs text-ink-400 sm:text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-xl border border-ink-200 px-3.5 py-2 text-xs font-semibold text-ink-500 sm:block">
          {today}
        </span>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition hover:border-brand-300 hover:text-brand-600">
          <FaBell size={15} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
