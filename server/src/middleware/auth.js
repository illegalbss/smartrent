const { verifyToken } = require("../utils/jwt");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Missing authorization token." });
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
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
function requireStaff() {
  return (req, res, next) => {
    authenticate(req, res, (err) => {
      if (err) return next(err);
      if (req.auth.role !== "landlord" && req.auth.role !== "secretary") {
        return res.status(403).json({ success: false, error: "Insufficient permissions." });
      }
      req.landlordId = req.auth.role === "landlord" ? req.auth.id : req.auth.landlordId;
      req.staffId = req.auth.id;
      req.staffRole = req.auth.role.toUpperCase();
      next();
    });
  };
}

module.exports = { requireAuth, requireStaff };
