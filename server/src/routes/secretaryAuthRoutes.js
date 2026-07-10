const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const {
  inviteSecretary,
  listSecretaries,
  removeSecretary,
  acceptInvite,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/secretaryAuthController");

const router = Router();

router.get("/secretaries", requireAuth("landlord"), listSecretaries);
router.post(
  "/secretaries/invite",
  requireAuth("landlord"),
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
  ],
  inviteSecretary
);
router.delete("/secretaries/:secretaryId", requireAuth("landlord"), removeSecretary);

router.post(
  "/auth/secretary/accept-invite",
  authLimiter,
  [
    body("token").trim().notEmpty().withMessage("Invite token is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  acceptInvite
);

router.post(
  "/auth/secretary/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  login
);

router.get("/secretary/profile", requireAuth("secretary"), getProfile);
router.put("/secretary/profile", requireAuth("secretary"), updateProfile);
router.post(
  "/auth/secretary/change-password",
  requireAuth("secretary"),
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  changePassword
);

module.exports = router;
