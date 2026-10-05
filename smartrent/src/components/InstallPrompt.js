import { useEffect, useState } from "react";
import { FaHome, FaShareSquare, FaTimes } from "react-icons/fa";
import { isIos, isStandalone, useInstallApp } from "../utils/installApp";

const DISMISS_KEY = "rentaflow_install_dismissed_at";
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const elapsedDays = (Date.now() - Number(raw)) / (1000 * 60 * 60 * 24);
  return elapsedDays < DISMISS_DAYS;
}

// Custom "Install RentaFlow" banner. Android/desktop Chrome fires
// `beforeinstallprompt`, which we capture and replay from our own button
// instead of relying on the browser's default UI. iOS never fires that
// event, so instead we show static "Add to Home Screen" instructions.
export default function InstallPrompt() {
  const { canPrompt, install } = useInstallApp();
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) {
      setDismissed(true);
      return;
    }
    if (isIos()) setShowIosHint(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }


  if (dismissed || isStandalone()) return null;
  if (!canPrompt && !showIosHint) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-md items-start gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-200">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-gold-400 ring-1 ring-gold-500/40">
          <FaHome size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-900">Install RentaFlow</p>
          {showIosHint && !canPrompt ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-ink-500">
              Tap <FaShareSquare className="inline text-brand-500" size={13} /> then
              "Add to Home Screen" for full-screen, one-tap access.
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-500">
              Add it to your home screen for full-screen, one-tap access.
            </p>
          )}

          {canPrompt && (
            <button
              onClick={install}
              className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-600"
            >
              Install
            </button>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink-600"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
}
