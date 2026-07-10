const crypto = require("crypto");
const prisma = require("../config/prisma");

const PAYSTACK_BASE = "https://api.paystack.co";

function toJsonSafe(value) {
  return value ? JSON.parse(JSON.stringify(value)) : undefined;
}

// Tenant starts an online rent payment. We compute the amount from the
// tenant's own room server-side — the client never gets to set the amount.
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

// Verifies the transaction directly with Paystack (never trusts the client's
// claim of success) and only then creates the Payment record.
async function verifyPayment(req, res, next) {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success: false, error: "A transaction reference is required." });

    const existing = await prisma.payment.findUnique({ where: { paystackReference: reference } });
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: req.auth.id },
      include: { room: true },
    });
    if (!tenant || !tenant.room) {
      return res.status(409).json({ success: false, error: "You are not currently assigned to a room." });
    }

    let paystackRes;
    try {
      paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
    } catch {
      return res.status(502).json({ success: false, error: "Could not reach Paystack. Please try again." });
    }

    const paystackJson = await paystackRes.json().catch(() => null);
    if (!paystackRes.ok || !paystackJson?.status) {
      return res.status(502).json({
        success: false,
        error: paystackJson?.message || "Unable to verify transaction with Paystack.",
      });
    }

    const txn = paystackJson.data;
    if (txn.status !== "success") {
      return res.status(402).json({ success: false, error: `Payment was not successful (status: ${txn.status}).` });
    }

    const amount = txn.amount / 100;

    const payment = await prisma.payment.create({
      data: {
        landlordId: tenant.landlordId,
        tenantId: tenant.id,
        roomId: tenant.roomId,
        amount,
        datePaid: txn.paid_at ? new Date(txn.paid_at) : new Date(),
        status: "PAID",
        source: "PAYSTACK",
        paystackReference: reference,
        notes: "Paid online via Paystack",
        createdById: tenant.id,
        createdByRole: "TENANT",
      },
    });

    await prisma.paymentAuditLog.create({
      data: {
        paymentId: payment.id,
        landlordId: tenant.landlordId,
        action: "CREATED",
        performedById: tenant.id,
        performedByRole: "TENANT",
        performedByName: tenant.name,
        newData: toJsonSafe(payment),
      },
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

module.exports = { initializePayment, verifyPayment };
