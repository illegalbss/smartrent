const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { initializePayment, verifyPayment } = require("../controllers/paystackController");

const router = Router();

router.post("/tenant/payments/paystack/initialize", requireAuth("tenant"), initializePayment);
router.post(
  "/tenant/payments/paystack/verify",
  requireAuth("tenant"),
  [body("reference").trim().notEmpty().withMessage("A transaction reference is required.")],
  verifyPayment
);

module.exports = router;
