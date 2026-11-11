import { createRoot } from "react-dom/client";
import PaymentSuccess from "../components/payments/PaymentSuccess";

// Opens the full-screen "payment saved" animation from anywhere:
//   showPaymentSuccess({ tenant, unit, amount, period, receiptNo, phone })
// `phone` (optional) pre-addresses the WhatsApp receipt to the tenant.
// Returns a promise that resolves when the person closes it. Only call this
// AFTER the server has confirmed the payment was saved.
export function showPaymentSuccess(details) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    function close() {
      root.unmount();
      host.remove();
      resolve();
    }

    root.render(<PaymentSuccess {...details} onClose={close} />);
  });
}
