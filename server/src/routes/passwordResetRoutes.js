const { Router } = require("express");
const { body } = require("express-validator");
const { authLimiter } = require("../middleware/rateLimit");
const { forgotPassword, resetPassword } = require("../controllers/passwordResetController");

const router = Router();

router.post(
  "/auth/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("A valid email is required.")],
  forgotPassword
);

router.post(
  "/auth/reset-password",
  authLimiter,
  [
    body("token").notEmpty().withMessage("Reset token is missing."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  resetPassword
);

module.exports = router;
