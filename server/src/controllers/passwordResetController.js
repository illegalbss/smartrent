const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { sendMail, isMailerConfigured } = require("../services/mailer");

const RESET_PURPOSE = "password_reset";
const RESET_EXPIRY = "1h";

const MODELS = {
  landlord: { model: () => prisma.landlord, label: "Landlord" },
  secretary: { model: () => prisma.secretary, label: "Secretary" },
  tenant: { model: () => prisma.tenant, label: "Tenant" },
};

// A short fingerprint of the current password hash, baked into the reset
// token. Once the password changes, the fingerprint no longer matches, so a
// reset link works exactly once — without needing a reset-token table.
function passwordFingerprint(passwordHash) {
  return crypto.createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);
}

function clientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");
}

async function findAccounts(email) {
  const where = { email: email.toLowerCase() };
  const found = await Promise.all(
    Object.entries(MODELS).map(async ([role, { model }]) => {
      const account = await model().findUnique({ where });
      // Secretaries/tenants who never accepted their invite have no password
      // yet — they need the invite link, not a reset.
      return account?.passwordHash ? { role, account } : null;
    })
  );
  return found.filter(Boolean);
}

function resetEmail(name, links) {
  const hasMany = links.length > 1;
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your RentaFlow password.",
    hasMany ? "Your email is linked to more than one account — use the link for the account you want to reset:" : "Use the link below to set a new password:",
    "",
    ...links.map((l) => (hasMany ? `${l.label}: ${l.url}` : l.url)),
    "",
    "This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.",
  ].join("\n");

  const buttons = links
    .map(
      (l) =>
        `<p style="margin:16px 0"><a href="${l.url}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">Reset ${hasMany ? `${l.label} ` : ""}Password</a></p>`
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;max-width:520px">
  <p>Hi ${name.replace(/[<>&"]/g, "")},</p>
  <p>We received a request to reset your RentaFlow password.</p>
  ${buttons}
  <p style="color:#6b7280;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>
</div>`;

  return { text, html };
}

async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    if (!isMailerConfigured()) {
      return res.status(503).json({ success: false, error: "Password reset email isn't set up yet. Contact support." });
    }

    const { email } = req.body;
    const accounts = await findAccounts(email);

    if (accounts.length > 0) {
      const links = accounts.map(({ role, account }) => {
        const token = jwt.sign(
          { sub: account.id, role, purpose: RESET_PURPOSE, fp: passwordFingerprint(account.passwordHash) },
          process.env.JWT_SECRET,
          { expiresIn: RESET_EXPIRY }
        );
        return { label: MODELS[role].label, url: `${clientUrl()}/reset-password?token=${encodeURIComponent(token)}` };
      });
      const { text, html } = resetEmail(accounts[0].account.name, links);
      await sendMail({ to: accounts[0].account.email, subject: "Reset your RentaFlow password", text, html });
    }

    // Same response whether or not the email exists, so this endpoint can't
    // be used to discover who has an account.
    res.json({ success: true, data: { message: "If an account exists for this email, a reset link has been sent." } });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { token, password } = req.body;
    const invalid = () =>
      res.status(400).json({ success: false, error: "This reset link is invalid or has expired. Request a new one." });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return invalid();
    }
    if (payload.purpose !== RESET_PURPOSE || !MODELS[payload.role]) return invalid();

    const model = MODELS[payload.role].model();
    const account = await model.findUnique({ where: { id: payload.sub } });
    if (!account?.passwordHash || passwordFingerprint(account.passwordHash) !== payload.fp) return invalid();

    const passwordHash = await bcrypt.hash(password, 10);
    await model.update({ where: { id: account.id }, data: { passwordHash } });

    res.json({ success: true, data: { message: "Password updated. You can now log in.", role: payload.role } });
  } catch (err) {
    next(err);
  }
}

module.exports = { forgotPassword, resetPassword };
