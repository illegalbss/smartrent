const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const { signup, login, getProfile, updateProfile, changePassword } = require("../controllers/landlordAuthController");

const router = Router();

router.post(
  "/auth/landlord/signup",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  signup
);

router.post(
  "/auth/landlord/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  login
);

router.get("/landlord/profile", requireAuth("landlord"), getProfile);
router.put("/landlord/profile", requireAuth("landlord"), updateProfile);
router.post(
  "/auth/landlord/change-password",
  requireAuth("landlord"),
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters."),
  ],
  changePassword
);

module.exports = router;
