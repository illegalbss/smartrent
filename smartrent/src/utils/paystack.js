const SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";

let scriptPromise = null;

function loadPaystackScript() {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the Paystack payment widget. Check your connection."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

// Opens the Paystack inline popup. onSuccess receives the transaction reference,
// which the caller must still verify server-side before treating it as paid.
export async function payWithPaystack({ publicKey, email, amount, reference, onSuccess, onClose }) {
  await loadPaystackScript();

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount,
    ref: reference,
    currency: "NGN",
    callback: (response) => onSuccess(response.reference),
    onClose,
  });
  handler.openIframe();
}
