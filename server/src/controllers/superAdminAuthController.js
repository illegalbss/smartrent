const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");

function sanitize(admin) {
  const { passwordHash, ...rest } = admin;
  return rest;
}

// No public signup route by design — Super Admin accounts are created only
// via the seed script (server/scripts/seed.js), run directly by the app owner.
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const admin = await prisma.superAdmin.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const token = signToken({ id: admin.id, role: "superadmin" });
    res.json({ success: true, data: { token, superadmin: sanitize(admin) } });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const admin = await prisma.superAdmin.findUnique({ where: { id: req.auth.id } });
    if (!admin) return res.status(404).json({ success: false, error: "Admin not found." });
    res.json({ success: true, data: sanitize(admin) });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getProfile };
