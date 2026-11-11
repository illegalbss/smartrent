import { useEffect, useRef } from "react";
import { FaLock, FaExclamationCircle } from "react-icons/fa";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Bottom sheet shown before a manual payment is saved, so staff can check
// the details. `onConfirm` does the actual save; the caller decides what
// happens on success (the success overlay) and passes `error` on failure.
export default function ConfirmPaymentSheet({ details, saving, error, onConfirm, onBack }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    sheetRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!saving) onBack();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...sheetRef.current.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === sheetRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const rows = [
    ["Tenant", details.tenant],
    ["Unit", details.unit],
    ["Period", details.period],
    ["Method", details.method],
    ["Status", details.status],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onBack} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-payment-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-6 pb-8 pt-3 text-site-text shadow-soft outline-none motion-safe:animate-[sheet-up_250ms_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-site-border" aria-hidden="true" />
        <h2 id="confirm-payment-title" className="m-0 font-display text-2xl font-bold">
          Confirm payment
        </h2>

        <dl className="m-0 mt-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-site-border py-3 text-[15px]">
              <dt className="text-site-muted">{label}</dt>
              <dd className="m-0 text-right font-semibold">{value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-site-muted">Amount</dt>
            <dd className="m-0 font-display text-[28px] font-bold">{details.amount}</dd>
          </div>
        </dl>

        <p className="m-0 mt-2 text-sm leading-relaxed text-site-muted">
          You are recording money you have already received. You can edit or delete it later, but every change stays in the
          history log.
        </p>
        <p className="m-0 mt-3 flex items-center gap-2 text-sm text-site-muted">
          <FaLock size={12} aria-hidden="true" className="shrink-0" /> Only you, your accountant and this tenant can see this record.
        </p>

        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm text-[#8A1C1C]">
            <p className="m-0 flex items-start gap-2 font-semibold">
              <FaExclamationCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              The payment was not saved.
            </p>
            <p className="m-0 mt-1 pl-[22px]">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          aria-busy={saving}
          className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand-700 px-6 text-base font-bold text-white disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          {saving && (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" aria-hidden="true" />
          )}
          {saving ? "Saving…" : error ? "Retry" : "Confirm and save"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="mx-auto mt-2 flex min-h-[44px] items-center rounded-lg px-3 text-[15px] font-semibold text-brand-700 underline-offset-4 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        >
          Go back and edit
        </button>
      </div>
    </div>
  );
}
