const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");
const { computeTenantPaymentStatus } = require("../services/tenantPaymentStatus");

function sanitize(tenant) {
  const { passwordHash, inviteToken, ...rest } = tenant;
  return rest;
}

async function acceptInvite(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { token, password } = req.body;
    const tenant = await prisma.tenant.findUnique({ where: { inviteToken: token } });
    if (!tenant) {
      return res.status(400).json({ success: false, error: "Invalid or expired invite token." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { passwordHash, inviteAcceptedAt: new Date(), inviteToken: null },
    });

    const authToken = signToken({ id: updated.id, role: "tenant", landlordId: updated.landlordId });
    res.json({ success: true, data: { token: authToken, tenant: sanitize(updated) } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const tenant = await prisma.tenant.findUnique({ where: { email: email.toLowerCase() } });
    if (!tenant || !tenant.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, tenant.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const authToken = signToken({ id: tenant.id, role: "tenant", landlordId: tenant.landlordId });
    res.json({ success: true, data: { token: authToken, tenant: sanitize(tenant) } });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.auth.id },
      include: {
        room: { include: { property: { select: { name: true, address: true, ownershipType: true } } } },
        payments: { orderBy: { datePaid: "desc" }, take: 1 },
      },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const paymentStatus = computeTenantPaymentStatus({
      room: tenant.room,
      latestPayment: tenant.payments[0] || null,
      fallbackDueDate: tenant.dateCommencement,
    });

    const { payments, ...tenantFields } = tenant;
    res.json({ success: true, data: { ...sanitize(tenantFields), paymentStatus } });
  } catch (err) {
    next(err);
  }
}

// Tenants can only update their own contact number — name, room, and lease
// dates are staff-managed to keep the tenancy record authoritative.
async function updateProfile(req, res, next) {
  try {
    const { phone } = req.body;
    const updated = await prisma.tenant.update({
      where: { id: req.auth.id },
      data: { ...(phone !== undefined && { phone }) },
    });
    res.json({ success: true, data: sanitize(updated) });
  } catch (err) {
    next(err);
  }
}

// Restricted self-service view: own room/property/rent/payment history/dates only.
// Documents are deliberately excluded — tenants cannot view tenancy documents.
async function getPayments(req, res, next) {
  try {
    const payments = await prisma.payment.findMany({
      where: { tenantId: req.auth.id },
      orderBy: { datePaid: "desc" },
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { currentPassword, newPassword } = req.body;
    const tenant = await prisma.tenant.findUnique({ where: { id: req.auth.id } });

    const valid = await bcrypt.compare(currentPassword, tenant.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: "Current password is incorrect." });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.tenant.update({ where: { id: tenant.id }, data: { passwordHash } });
    res.json({ success: true, data: { message: "Password updated successfully." } });
  } catch (err) {
    next(err);
  }
}

module.exports = { acceptInvite, login, getProfile, updateProfile, getPayments, changePassword };
