const prisma = require("../config/prisma");

// req.ip already accounts for the trusted proxy (see app.js). Reading the
// first X-Forwarded-For entry directly would log whatever the client claims.
function extractIp(req) {
  return req.ip || req.socket?.remoteAddress || null;
}

// Records one login attempt (success or failure) for the Super Admin's
// Activity Logs view. Never throws — a logging failure must not break the
// actual login flow it's observing.
async function logLoginAttempt({ req, userId, userName, userRole, landlordId, action, attemptedEmail }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        userName: userName || null,
        userRole,
        landlordId: landlordId || null,
        action,
        attemptedEmail: attemptedEmail || null,
        ipAddress: extractIp(req),
      },
    });
  } catch {
    // Swallow — see comment above.
  }
}

module.exports = { logLoginAttempt };
