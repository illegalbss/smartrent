const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");
const { isSubscriptionBlocked, subscriptionBlockedMessage } = require("../services/subscriptionGuard");

function sanitize(landlord) {
  const { passwordHash, ...rest } = landlord;
  return rest;
}

async function signup(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, email, password, phone, accountType } = req.body;
    const existing = await prisma.landlord.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const landlord = await prisma.landlord.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone,
        // Individual vs. Organization — carried into Payout Setup later so the
        // landlord doesn't have to answer the same question twice; they can
        // still change it there before actually creating the Paystack subaccount.
        ...(accountType && ["INDIVIDUAL", "ORGANIZATION"].includes(accountType) && { accountType }),
      },
    });

    const token = signToken({ id: landlord.id, role: "landlord" });
    res.status(201).json({ success: true, data: { token, landlord: sanitize(landlord) } });
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
    const landlord = await prisma.landlord.findUnique({ where: { email: email.toLowerCase() } });
    if (!landlord) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, landlord.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    if (isSubscriptionBlocked(landlord.subscriptionStatus)) {
      return res.status(402).json({
        success: false,
        error: subscriptionBlockedMessage(landlord.subscriptionStatus),
        code: "SUBSCRIPTION_BLOCKED",
      });
    }

    const token = signToken({ id: landlord.id, role: "landlord" });
    res.json({ success: true, data: { token, landlord: sanitize(landlord) } });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: req.auth.id } });
    if (!landlord) return res.status(404).json({ success: false, error: "Landlord not found." });
    res.json({ success: true, data: sanitize(landlord) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const landlord = await prisma.landlord.update({
      where: { id: req.auth.id },
      data: { name, phone },
    });
    res.json({ success: true, data: sanitize(landlord) });
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
    const landlord = await prisma.landlord.findUnique({ where: { id: req.auth.id } });

    const valid = await bcrypt.compare(currentPassword, landlord.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: "Current password is incorrect." });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.landlord.update({ where: { id: landlord.id }, data: { passwordHash } });
    res.json({ success: true, data: { message: "Password updated successfully." } });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, getProfile, updateProfile, changePassword };
