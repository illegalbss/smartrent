const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth } = require("../middleware/auth");
const { initializePayment, verifyPayment, handleWebhook } = require("../controllers/paystackController");

const router = Router();

router.post("/tenant/payments/paystack/initialize", requireAuth("tenant"), initializePayment);
router.post(
  "/tenant/payments/paystack/verify",
  requireAuth("tenant"),
  [body("reference").trim().notEmpty().withMessage("A transaction reference is required.")],
  verifyPayment
);

// No auth middleware — Paystack calls this directly. The HMAC signature
// check inside handleWebhook is what authenticates the request instead.
router.post("/paystack/webhook", handleWebhook);

module.exports = router;
