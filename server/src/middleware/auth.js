const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/prisma");

// "Log out of all devices" stores a cut-off time on the account; tokens
// issued before it are refused. Looked up per request with a short cache.
const MODEL = { landlord: "landlord", secretary: "secretary", tenant: "tenant", superadmin: "superAdmin" };
const cutoffCache = new Map();
const CUTOFF_TTL_MS = 30 * 1000;

async function sessionCutoff(role, id) {
  const key = `${role}:${id}`;
  const hit = cutoffCache.get(key);
  if (hit && Date.now() - hit.at < CUTOFF_TTL_MS) return hit.value;
  const model = MODEL[role];
  if (!model) return null;
  const row = await prisma[model].findUnique({ where: { id }, select: { sessionsValidAfter: true } });
  // A deleted account has no valid sessions at all.
  const value = row ? row.sessionsValidAfter : new Date(8.64e15);
  cutoffCache.set(key, { value, at: Date.now() });
  return value;
}

function forgetSessionCutoff(role, id) {
  cutoffCache.delete(`${role}:${id}`);
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Missing authorization token." });
  }

  try {
    const payload = verifyToken(token);
    // Special-purpose tokens (e.g. password reset links) are signed with the
    // same secret but are never valid as a login session.
    if (payload.purpose || !payload.id) {
      return res.status(401).json({ success: false, error: "Invalid or expired token.", code: "SESSION_ENDED" });
    }
    req.auth = payload;
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token.", code: "SESSION_ENDED" });
  }
  sessionCutoff(req.auth.role, req.auth.id)
    .then((cutoff) => {
      if (cutoff && req.auth.iat < Math.floor(new Date(cutoff).getTime() / 1000)) {
        return res.status(401).json({ success: false, error: "You were logged out. Please log in again.", code: "SESSION_ENDED" });
      }
      next();
    })
    .catch(next);
}

function requireAuth(requiredRole) {
  return (req, res, next) => {
    authenticate(req, res, (err) => {
      if (err) return next(err);
      if (requiredRole && req.auth.role !== requiredRole) {
        return res.status(403).json({ success: false, error: "Insufficient permissions." });
      }
      next();
    });
  };
}

// Landlord and Secretary both operate within one landlord's portfolio.
// Attaches req.landlordId (resolved), req.staffId, req.staffRole for convenience.
// Once subscriptionStatus is EXPIRED/CANCELED, mutating requests are blocked
// (read access stays available) so a landlord can still see their data and
// renew, but can't keep adding tenants/payments/etc. on a lapsed account.
function requireStaff() {
  return (req, res, next) => {
    authenticate(req, res, async (err) => {
      if (err) return next(err);
      if (req.auth.role !== "landlord" && req.auth.role !== "secretary") {
        return res.status(403).json({ success: false, error: "Insufficient permissions." });
      }
      req.landlordId = req.auth.role === "landlord" ? req.auth.id : req.auth.landlordId;
      req.staffId = req.auth.id;
      req.staffRole = req.auth.role.toUpperCase();

      if (req.method !== "GET") {
        try {
          const landlord = await prisma.landlord.findUnique({
            where: { id: req.landlordId },
            select: { subscriptionStatus: true },
          });
          if (landlord && (landlord.subscriptionStatus === "EXPIRED" || landlord.subscriptionStatus === "CANCELED")) {
            return res.status(402).json({
              success: false,
              error: "Your subscription has lapsed. Renew your plan to continue making changes.",
              code: "SUBSCRIPTION_INACTIVE",
            });
          }
        } catch (dbErr) {
          return next(dbErr);
        }
      }
      next();
    });
  };
}

module.exports = { requireAuth, requireStaff, forgetSessionCutoff, MODEL };
