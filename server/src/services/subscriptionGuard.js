// Blocks login entirely (not just write actions — see middleware/auth.js's
// requireStaff for that layer) once a landlord's subscription has expired or
// been deactivated by Super Admin. Applied to both landlord and secretary
// login, since a secretary's access is really the landlord's account access.
const BLOCKED_STATUSES = ["EXPIRED", "CANCELED"];

function isSubscriptionBlocked(status) {
  return BLOCKED_STATUSES.includes(status);
}

function subscriptionBlockedMessage(status) {
  return status === "CANCELED"
    ? "This account has been deactivated. Contact support to reactivate it."
    : "Your subscription has expired. Renew your plan to regain access.";
}

module.exports = { isSubscriptionBlocked, subscriptionBlockedMessage };
