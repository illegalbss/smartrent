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
// `channels` narrows the popup to a specific payment method (card/bank_transfer/ussd) —
// Paystack itself handles all of these within the one integration.
// `subaccount`/`transactionCharge`/`bearer` route the landlord's share to their
// own Paystack subaccount, keeping RentaFlow's 1% (capped) fee. `plan` opts
// the tenant into recurring billing matching their room's rent frequency.
export async function payWithPaystack({
  publicKey,
  email,
  amount,
  reference,
  channels,
  subaccount,
  transactionCharge,
  bearer,
  plan,
  onSuccess,
  onClose,
}) {
  await loadPaystackScript();

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount,
    ref: reference,
    currency: "NGN",
    ...(channels && { channels }),
    ...(subaccount && { subaccount }),
    ...(transactionCharge && { transaction_charge: transactionCharge }),
    ...(bearer && { bearer }),
    ...(plan && { plan }),
    callback: (response) => onSuccess(response.reference),
    onClose,
  });
  handler.openIframe();
}
