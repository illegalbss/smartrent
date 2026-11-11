import { useEffect, useState } from "react";
import { showPaymentSuccess } from "../../utils/paymentSuccess";
import ConfirmPaymentSheet from "../../components/payments/ConfirmPaymentSheet";

// Development-only page (see App.js) for trying the confirm sheet and the
// payment-success overlay with sample details and a SIMULATED save — nothing
// is sent to the server. Not included in production builds.
const SAMPLE = {
  tenant: "Chinedu Eze",
  unit: "Flat 2B",
  amount: 150000,
  period: "Nov 2026 rent",
  receiptNo: "#RF2026A1",
  phone: "08031234567",
};

const fakeSave = (shouldFail) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (shouldFail ? reject(new Error("Can't reach the RentaFlow server. (Simulated failure.)")) : resolve()), 1200)
  );

export default function PaymentSuccessPreview() {
  const [closedAt, setClosedAt] = useState(null);
  const [sheet, setSheet] = useState(null); // { failNext: bool }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function openSuccess() {
    await showPaymentSuccess(SAMPLE);
    setClosedAt(new Date().toLocaleTimeString());
  }

  async function confirm() {
    setSaving(true);
    setError("");
    try {
      await fakeSave(sheet.failNext);
    } catch (err) {
      setError(err.message);
      setSheet({ failNext: false }); // the Retry will succeed
      return;
    } finally {
      setSaving(false);
    }
    setSheet(null);
    await new Promise((r) => setTimeout(r, 0));
    openSuccess();
  }

  // For screenshots: ?open=1 opens the success screen, ?sheet=1 the confirm
  // sheet, ?sheet=error the sheet showing a failed save.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("open") === "1") openSuccess();
    if (params.get("sheet")) setSheet({ failNext: false });
    if (params.get("sheet") === "error") setError("Can't reach the RentaFlow server. (Simulated failure.)");
  }, []);

  const button = "min-h-[44px] rounded-xl bg-brand-700 px-5 font-bold text-white";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-site-cream p-6 text-site-text">
      <p className="text-sm text-site-muted">Development preview: sample data, simulated saves. Nothing is sent to the server.</p>
      <button type="button" onClick={openSuccess} className={button}>Show payment success</button>
      <button type="button" onClick={() => { setError(""); setSheet({ failNext: false }); }} className={button}>
        Confirm sheet: save succeeds
      </button>
      <button type="button" onClick={() => { setError(""); setSheet({ failNext: true }); }} className={button}>
        Confirm sheet: save fails, then Retry works
      </button>
      {closedAt && <p className="text-sm">Closed at {closedAt}.</p>}

      {sheet && (
        <ConfirmPaymentSheet
          details={{ ...SAMPLE, method: "Cash", status: "Paid", amount: "₦150,000" }}
          saving={saving}
          error={error}
          onConfirm={confirm}
          onBack={() => setSheet(null)}
        />
      )}
    </div>
  );
}
