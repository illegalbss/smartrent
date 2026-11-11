import { useEffect, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { whatsappUrl } from "../../utils/whatsapp";
import "./PaymentSuccess.css";

function formatAmount(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}` : String(amount ?? "");
}

export function receiptMessage({ tenant, unit, amount, period, receiptNo }) {
  return [
    `Hello ${tenant}, your payment has been received. Thank you.`,
    "",
    `Amount: ${formatAmount(amount)}`,
    period && `Period: ${period}`,
    unit && `Unit: ${unit}`,
    receiptNo && `Receipt no.: ${receiptNo}`,
    "",
    "Sent via RentaFlow",
  ]
    .filter((line) => line !== undefined && line !== null && line !== false)
    .join("\n");
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Chip shown on the receipt card, matching what was actually recorded.
const STATUS_CHIP = {
  PAID: { label: "Paid", className: "bg-[#E3F2E7] text-[#1F6B3A]" },
  PARTIAL: { label: "Part-paid", className: "bg-[#FFF1CC] text-[#6B4E00]" },
  OWING: { label: "Owing", className: "bg-[#FBE6E6] text-[#8A1C1C]" },
};

// Full-screen "payment saved" confirmation. Opened via showPaymentSuccess()
// in utils/paymentSuccess.js — never shown unless the server confirmed the save.
export default function PaymentSuccess({ tenant, unit, amount, period, receiptNo, phone, status = "PAID", onClose }) {
  const chip = STATUS_CHIP[status] || STATUS_CHIP.PAID;
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    // Focus the dialog itself (not a button that is still fading in), so
    // screen readers announce it and Tab moves to its buttons.
    dialogRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Escape closes; Tab stays inside the dialog. Bound to the dialog itself,
  // not the whole page.
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rf-success-title"
      aria-describedby="rf-success-desc"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="rf-success outline-none fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-site-cream px-6 py-10 text-site-text"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none" role="img" aria-label="Payment saved">
          <circle className="ring" cx="48" cy="48" r="36" stroke="#1F6B3A" strokeWidth="6" strokeLinecap="round" transform="rotate(-90 48 48)" />
          <path className="tick" d="M32 49l11 11 22-24" stroke="#1F6B3A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="pop mt-6">
          <h2 id="rf-success-title" className="m-0 font-display text-[44px] font-bold leading-tight">
            {formatAmount(amount)}
          </h2>
          <p id="rf-success-desc" className="m-0 mt-2 text-base text-site-muted">
            Payment saved for {tenant}
            {unit ? `, ${unit}` : ""}
          </p>
        </div>

        <div className="pop2 mt-7 w-full">
          <dl className="m-0 w-full rounded-2xl border border-site-border bg-white px-5 py-1 text-left text-[15px]">
            <div className="flex items-center justify-between gap-4 border-b border-site-border py-3">
              <dt className="text-site-muted">Receipt no.</dt>
              <dd className="m-0 font-semibold">{receiptNo}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-site-border py-3">
              <dt className="text-site-muted">Period</dt>
              <dd className="m-0 font-semibold">{period}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-site-muted">Status</dt>
              <dd className="m-0">
                <span className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${chip.className}`}>{chip.label}</span>
              </dd>
            </div>
          </dl>

          <a
            href={whatsappUrl(phone, receiptMessage({ tenant, unit, amount, period, receiptNo }))}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-gold-500 px-6 text-base font-bold text-site-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:ring-offset-site-cream"
          >
            <FaWhatsapp size={18} aria-hidden="true" /> Send receipt on WhatsApp
          </a>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-3 text-[15px] font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
