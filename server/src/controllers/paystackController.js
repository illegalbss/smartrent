const crypto = require("crypto");
const prisma = require("../config/prisma");
const { resolveCoverage } = require("../services/paymentDates");
const { paystackRequest } = require("../services/paystackClient");
const { calculatePlatformFee, calculatePlatformFeeKobo, FEE_CAP } = require("../services/platformFee");

const PAYSTACK_BASE = "https://api.paystack.co";
const PAYSTACK_INTERVAL = { MONTHLY: "monthly", QUARTERLY: "quarterly", YEARLY: "annually" };

function toJsonSafe(value) {
  return value ? JSON.parse(JSON.stringify(value)) : undefined;
}

// One Paystack Plan per (amount, frequency) pairing — created on demand the
// first time a tenant opts into recurring billing at that rent/frequency.
// NOTE: unverified against a live Paystack account — built against Paystack's
// documented Plan API shape (see server/README or the session notes on why).
async function getOrCreatePlanCode(amountNaira, rentFrequency) {
  const interval = PAYSTACK_INTERVAL[rentFrequency] || "annually";
  const result = await paystackRequest("POST", "/plan", {
    name: `RentaFlow Rent — ${interval} — NGN${amountNaira}`,
    amount: Math.round(amountNaira * 100),
    interval,
  });
  if (!result.ok) return null;
  return result.data.plan_code;
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

    const landlord = await prisma.landlord.findUnique({
      where: { id: tenant.landlordId },
      select: { paystackSubaccountCode: true },
    });
    if (!landlord?.paystackSubaccountCode) {
      return res.status(409).json({
        success: false,
        error: "Online rent collection isn't set up for this property yet. Contact your landlord.",
        code: "PAYOUT_NOT_CONFIGURED",
      });
    }

    const reference = `sr_${crypto.randomBytes(12).toString("hex")}`;
    const rentAmountNaira = Number(tenant.room.rentAmount);
    const amountKobo = Math.round(rentAmountNaira * 100);

    await prisma.paystackTransaction.create({
      data: {
        reference,
        tenantId: tenant.id,
        landlordId: tenant.landlordId,
        roomId: tenant.roomId,
        amount: tenant.room.rentAmount,
      },
    });

    // Paystack's subaccount percentage_charge (set to 1% at subaccount
    // creation) applies automatically. Above the ₦25,000 cap, override with
    // a fixed transaction_charge instead — Paystack has no built-in cap.
    const percentageFeeNaira = rentAmountNaira * 0.01;
    const splitParams = { subaccount: landlord.paystackSubaccountCode };
    if (percentageFeeNaira > FEE_CAP) {
      splitParams.transactionCharge = calculatePlatformFeeKobo(rentAmountNaira);
      splitParams.bearer = "subaccount";
    }

    let planCode;
    if (req.body?.enableRecurring) {
      planCode = await getOrCreatePlanCode(rentAmountNaira, tenant.room.rentFrequency);
    }

    res.json({
      success: true,
      data: {
        reference,
        amount: amountKobo,
        email: tenant.email,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
        ...splitParams,
        ...(planCode && { plan: planCode }),
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
      // Actually charged by construction — see initializePayment's splitParams.
      platformFeeCharged: calculatePlatformFee(amount),
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

  // A recurring-billing transaction attaches subscription details to the
  // charge itself, in addition to the separate subscription.create webhook
  // handled below — capture it here too in case that event is delayed/missed.
  if (txn.plan_object?.plan_code || txn.plan) {
    await prisma.tenantSubscription
      .upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          subscriptionCode: txn.subscription_code || `pending_${txn.id}`,
          nextChargeDate: null,
          status: "ACTIVE",
        },
        update: { status: "ACTIVE" },
      })
      .catch(() => {});
  }

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

async function handleSubscriptionEvent(event) {
  const data = event.data;
  if (!data) return;

  if (event.event === "subscription.create") {
    const tenant = await prisma.tenant.findUnique({ where: { email: data.customer?.email?.toLowerCase() } });
    if (!tenant) return;
    await prisma.tenantSubscription.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        subscriptionCode: data.subscription_code,
        emailToken: data.email_token || null,
        nextChargeDate: data.next_payment_date ? new Date(data.next_payment_date) : null,
        status: "ACTIVE",
      },
      update: {
        subscriptionCode: data.subscription_code,
        emailToken: data.email_token || null,
        nextChargeDate: data.next_payment_date ? new Date(data.next_payment_date) : null,
        status: "ACTIVE",
      },
    });
  }

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    const sub = await prisma.tenantSubscription.findUnique({ where: { subscriptionCode: data.subscription_code } });
    if (sub) await prisma.tenantSubscription.update({ where: { id: sub.id }, data: { status: "DISABLED" } });
  }

  if (event.event === "invoice.payment_failed") {
    const subCode = data.subscription?.subscription_code;
    if (!subCode) return;
    const sub = await prisma.tenantSubscription.findUnique({ where: { subscriptionCode: subCode } });
    if (sub) await prisma.tenantSubscription.update({ where: { id: sub.id }, data: { status: "ATTENTION" } });
  }
}

// Server-triggered path: Paystack calls this directly whenever a transaction
// completes, independent of whether the tenant's browser is still open.
// This is what makes delayed methods (bank transfer, USSD) reliable — a
// tenant can close the tab right after getting their transfer details and
// the payment still lands here once they actually pay. Also handles
// recurring-subscription lifecycle events (create/disable/failed charge).
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
    } else if (event.event?.startsWith("subscription.") || event.event === "invoice.payment_failed") {
      await handleSubscriptionEvent(event).catch((err) => console.error("Webhook subscription handling failed:", err));
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
