const { Router } = require("express");
const { body } = require("express-validator");
const { requireStaff } = require("../middleware/auth");
const {
  createPayment,
  listPaymentsForTenant,
  updatePayment,
  deletePayment,
  listAuditLog,
  listMonthlyLedger,
} = require("../controllers/paymentController");

const router = Router();
const staff = requireStaff();

const paymentValidators = [
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number."),
  body("datePaid").isISO8601().withMessage("A valid payment date is required."),
  body("coverageStart").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid coverage start date."),
  body("coverageEnd").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid coverage end date."),
  body("status").optional().isIn(["PAID", "PARTIAL", "OWING"]).withMessage("Invalid payment status."),
];

router.get("/tenants/:tenantId/payments", staff, listPaymentsForTenant);
router.post("/tenants/:tenantId/payments", staff, paymentValidators, createPayment);

router.put(
  "/payments/:paymentId",
  staff,
  [
    body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be a positive number."),
    body("datePaid").optional().isISO8601().withMessage("Invalid payment date."),
    body("coverageStart").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid coverage start date."),
    body("coverageEnd").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid coverage end date."),
    body("status").optional().isIn(["PAID", "PARTIAL", "OWING"]).withMessage("Invalid payment status."),
  ],
  updatePayment
);
router.delete("/payments/:paymentId", staff, deletePayment);

router.get("/payments/audit-log", staff, listAuditLog);
router.get("/payments/ledger", staff, listMonthlyLedger);

module.exports = router;
