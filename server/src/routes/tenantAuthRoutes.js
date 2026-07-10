const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const {
  acceptInvite,
  login,
  getProfile,
  updateProfile,
  getPayments,
  changePassword,
} = require("../controllers/tenantAuthController");

const router = Router();

router.post(
  "/auth/tenant/accept-invite",
  authLimiter,
  [
    body("token").trim().notEmpty().withMessage("Invite token is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  acceptInvite
);

router.post(
  "/auth/tenant/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  login
);

router.get("/tenant/profile", requireAuth("tenant"), getProfile);
router.put("/tenant/profile", requireAuth("tenant"), updateProfile);
router.get("/tenant/payments", requireAuth("tenant"), getPayments);
router.post(
  "/auth/tenant/change-password",
  requireAuth("tenant"),
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  changePassword
);

module.exports = router;
