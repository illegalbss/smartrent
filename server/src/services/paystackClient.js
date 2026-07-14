// Thin wrapper around Paystack's REST API — every call goes through here so
// auth headers and error shape stay consistent across subaccount setup,
// transaction init/verify, plans, and subscriptions.
const PAYSTACK_BASE = "https://api.paystack.co";

async function paystackRequest(method, path, body) {
  let res;
  try {
    res = await fetch(`${PAYSTACK_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, status: 502, error: "Could not reach Paystack. Please try again." };
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) {
    return { ok: false, status: res.status || 502, error: json?.message || "Paystack request failed.", json };
  }
  return { ok: true, status: res.status, data: json.data, json };
}

module.exports = { paystackRequest };
