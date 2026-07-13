const crypto = require("crypto");
const prisma = require("../config/prisma");
const { resolveCoverage } = require("../services/paymentDates");

const PAYSTACK_BASE = "https://api.paystack.co";

function toJsonSafe(value) {
  return value ? JSON.parse(JSON.stringify(value)) : undefined;
}

// Tenant starts an online rent payment. We compute the amount from the
// tenant's own room server-side — the client never gets to set the amount.
// A PaystackTransaction row remembers which tenant/room this reference
// belongs to, since neither the client's later verify call nor Paystack's
// webhook carry that context on their own.
async function initializePayment(req, res, next) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.auth.id },
      include: { room: true },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });
    if (!tenant.room) {
      return res.status(409).json({ success: false, error: "You are not currently assigned to a room." });
    }

    const reference = `sr_${crypto.randomBytes(12).toString("hex")}`;
    const amountKobo = Math.round(Number(tenant.room.rentAmount) * 100);

    await prisma.paystackTransaction.create({
      data: {
        reference,
        tenantId: tenant.id,
        landlordId: tenant.landlordId,
        roomId: tenant.roomId,
        amount: tenant.room.rentAmount,
      },
    });

    res.json({
      success: true,
      data: {
        reference,
        amount: amountKobo,
        email: tenant.email,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Verifies a reference directly with Paystack and records the Payment.
// Shared by the client-triggered verify call and the server-side webhook —
// idempotent (a reference already recorded is a no-op) so whichever path
// reaches it first wins and the other becomes harmless.
async function finalizePayment(reference) {
  const existing = await prisma.payment.findUnique({ where: { paystackReference: reference } });
  if (existing) return { ok: true, payment: existing };

  const txnRecord = await prisma.paystackTransaction.findUnique({ where: { reference } });
  if (!txnRecord) return { ok: false, status: 404, error: "Unknown transaction reference." };

  let paystackRes;
  try {
    paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
  } catch {
    return { ok: false, status: 502, error: "Could not reach Paystack. Please try again." };
  }

  const paystackJson = await paystackRes.json().catch(() => null);
  if (!paystackRes.ok || !paystackJson?.status) {
    return { ok: false, status: 502, error: paystackJson?.message || "Unable to verify transaction with Paystack." };
  }

  const txn = paystackJson.data;
  if (txn.status !== "success") {
    return { ok: false, status: 402, error: `Payment was not successful (status: ${txn.status}).` };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: txnRecord.tenantId },
    include: { room: { select: { rentFrequency: true } } },
  });
  if (!tenant) return { ok: false, status: 404, error: "Tenant not found." };

  const amount = txn.amount / 100;
  const datePaid = txn.paid_at ? new Date(txn.paid_at) : new Date();
  const coverage = resolveCoverage({ datePaid, rentFrequency: tenant.room?.rentFrequency });
  const payment = await prisma.payment.create({
    data: {
      landlordId: txnRecord.landlordId,
      tenantId: txnRecord.tenantId,
      roomId: txnRecord.roomId,
      amount,
      datePaid,
      coverageStart: coverage.coverageStart,
      coverageEnd: coverage.coverageEnd,
      status: "PAID",
      source: "PAYSTACK",
      paystackReference: reference,
      notes: "Paid online via Paystack",
      createdById: txnRecord.tenantId,
      createdByRole: "TENANT",
    },
  });

  await prisma.paymentAuditLog.create({
    data: {
      paymentId: payment.id,
      landlordId: txnRecord.landlordId,
      action: "CREATED",
      performedById: txnRecord.tenantId,
      performedByRole: "TENANT",
      performedByName: tenant.name,
      newData: toJsonSafe(payment),
    },
  });

  await prisma.paystackTransaction.update({ where: { id: txnRecord.id }, data: { consumedAt: new Date() } });

  return { ok: true, payment };
}

// Client-triggered path: fires right after Paystack's popup reports success
// in the browser. Works great for card payments (instant).
async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success: false, error: "A transaction reference is required." });

    const result = await finalizePayment(reference);
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });
    res.status(201).json({ success: true, data: result.payment });
  } catch (err) {
    next(err);
  }
}

// Server-triggered path: Paystack calls this directly whenever a transaction
// completes, independent of whether the tenant's browser is still open.
// This is what makes delayed methods (bank transfer, USSD) reliable — a
// tenant can close the tab right after getting their transfer details and
// the payment still lands here once they actually pay.
async function handleWebhook(req, res) {
  try {
    const signature = req.headers["x-paystack-signature"];
    if (!process.env.PAYSTACK_SECRET_KEY || !signature || !req.rawBody) {
      return res.sendStatus(401);
    }

    const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(req.rawBody).digest("hex");
    if (hash !== signature) {
      return res.sendStatus(401);
    }

    const event = req.body;
    if (event.event === "charge.success" && event.data?.reference) {
      const result = await finalizePayment(event.data.reference);
      if (!result.ok) console.error("Webhook payment finalize failed:", result.error);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Paystack webhook error:", err);
    // Acknowledge anyway so Paystack doesn't retry-storm — the error above is
    // what to check if a payment seems to be missing.
    res.sendStatus(200);
  }
}

module.exports = { initializePayment, verifyPayment, handleWebhook };
