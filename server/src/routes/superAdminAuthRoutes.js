const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { login, getProfile } = require("../controllers/superAdminAuthController");

const router = Router();

router.post(
  "/auth/superadmin/login",
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  login
);
router.get("/superadmin/profile", requireAuth("superadmin"), getProfile);

module.exports = router;
