const prisma = require("../config/prisma");
const { signToken } = require("../utils/jwt");
const { forgetSessionCutoff, MODEL } = require("../middleware/auth");

// Logs this account out everywhere else: every login token issued before now
// stops working. This device gets a fresh token so it stays logged in.
async function logoutEverywhere(req, res, next) {
  try {
    const { role, id } = req.auth;
    const model = MODEL[role];
    if (!model) return res.status(400).json({ success: false, error: "Not supported for this account." });
    // Cut-off on a whole second, and the new token is signed after it, so
    // only older tokens are refused.
    const cutoff = new Date(Math.floor(Date.now() / 1000) * 1000);
    await prisma[model].update({ where: { id }, data: { sessionsValidAfter: cutoff } });
    forgetSessionCutoff(role, id);
    const { iat, exp, ...claims } = req.auth;
    const token = signToken(claims);
    res.json({ success: true, data: { token } });
  } catch (err) {
    next(err);
  }
}

const MAX_READ_IDS = 400;

async function getReadNotifications(req, res, next) {
  try {
    const row = await prisma.notificationRead.findUnique({
      where: { role_userId: { role: req.auth.role, userId: req.auth.id } },
    });
    res.json({ success: true, data: { ids: Array.isArray(row?.readIds) ? row.readIds : [] } });
  } catch (err) {
    next(err);
  }
}

async function saveReadNotifications(req, res, next) {
  try {
    const raw = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const ids = [...new Set(raw.filter((x) => typeof x === "string" && x.length <= 80))].slice(-MAX_READ_IDS);
    await prisma.notificationRead.upsert({
      where: { role_userId: { role: req.auth.role, userId: req.auth.id } },
      create: { role: req.auth.role, userId: req.auth.id, readIds: ids },
      update: { readIds: ids },
    });
    res.json({ success: true, data: { ids } });
  } catch (err) {
    next(err);
  }
}

module.exports = { logoutEverywhere, getReadNotifications, saveReadNotifications };
