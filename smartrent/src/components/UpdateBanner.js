import { useEffect, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { isUpdateAvailable, refreshApp } from "../utils/appUpdate";

const CHECK_EVERY_MS = 5 * 60 * 1000;

// Shown app-wide when a newer version has been deployed. Checks on load,
// every few minutes, and whenever the app comes back to the foreground
// (e.g. reopening the installed app on a phone).
export default function UpdateBanner() {
  const [available, setAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if ((await isUpdateAvailable()) && !cancelled) setAvailable(true);
    }
    function onVisible() {
      if (document.visibilityState === "visible") check();
    }

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!available) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-white shadow-soft">
        <FaSyncAlt size={14} className="shrink-0 text-gold-400" />
        <p className="flex-1 text-sm">
          <span className="font-semibold">A new version of RentaFlow is ready.</span> Refresh to get the latest updates.
        </p>
        <button
          onClick={() => {
            setRefreshing(true);
            refreshApp();
          }}
          disabled={refreshing}
          className="shrink-0 rounded-lg bg-brand-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
