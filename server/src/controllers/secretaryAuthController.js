const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");

function sanitize(secretary) {
  const { passwordHash, inviteToken, ...rest } = secretary;
  return rest;
}

async function inviteSecretary(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, email, phone } = req.body;
    const existing = await prisma.secretary.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, error: "A secretary with this email already exists." });
    }

    const inviteToken = crypto.randomBytes(24).toString("hex");
    const secretary = await prisma.secretary.create({
      data: { landlordId: req.auth.id, name, email: email.toLowerCase(), phone, inviteToken },
    });

    // In production this token is dispatched via email, not returned in the response.
    res.status(201).json({ success: true, data: { ...sanitize(secretary), inviteToken } });
  } catch (err) {
    next(err);
  }
}

async function listSecretaries(req, res, next) {
  try {
    const secretaries = await prisma.secretary.findMany({
      where: { landlordId: req.auth.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: secretaries.map(sanitize) });
  } catch (err) {
    next(err);
  }
}

async function removeSecretary(req, res, next) {
  try {
    const secretary = await prisma.secretary.findFirst({
      where: { id: req.params.secretaryId, landlordId: req.auth.id },
    });
    if (!secretary) return res.status(404).json({ success: false, error: "Secretary not found." });
    await prisma.secretary.delete({ where: { id: secretary.id } });
    res.json({ success: true, data: { message: "Secretary removed." } });
  } catch (err) {
    next(err);
  }
}

async function acceptInvite(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { token, password } = req.body;
    const secretary = await prisma.secretary.findUnique({ where: { inviteToken: token } });
    if (!secretary) {
      return res.status(400).json({ success: false, error: "Invalid or expired invite token." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await prisma.secretary.update({
      where: { id: secretary.id },
      data: { passwordHash, inviteAcceptedAt: new Date(), inviteToken: null },
    });

    const authToken = signToken({ id: updated.id, role: "secretary", landlordId: updated.landlordId });
    res.json({ success: true, data: { token: authToken, secretary: sanitize(updated) } });
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
    const secretary = await prisma.secretary.findUnique({ where: { email: email.toLowerCase() } });
    if (!secretary || !secretary.passwordHash) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, secretary.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const authToken = signToken({ id: secretary.id, role: "secretary", landlordId: secretary.landlordId });
    res.json({ success: true, data: { token: authToken, secretary: sanitize(secretary) } });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const secretary = await prisma.secretary.findUnique({ where: { id: req.auth.id } });
    if (!secretary) return res.status(404).json({ success: false, error: "Secretary not found." });
    res.json({ success: true, data: sanitize(secretary) });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const updated = await prisma.secretary.update({
      where: { id: req.auth.id },
      data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }) },
    });
    res.json({ success: true, data: sanitize(updated) });
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
    const secretary = await prisma.secretary.findUnique({ where: { id: req.auth.id } });

    const valid = await bcrypt.compare(currentPassword, secretary.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: "Current password is incorrect." });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.secretary.update({ where: { id: secretary.id }, data: { passwordHash } });
    res.json({ success: true, data: { message: "Password updated successfully." } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  inviteSecretary,
  listSecretaries,
  removeSecretary,
  acceptInvite,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
