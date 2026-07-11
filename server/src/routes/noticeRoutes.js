const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const { createNotice, listForStaff, listOwnNotices, deleteNotice } = require("../controllers/noticeController");

const router = Router();
const staff = requireStaff();

router.post(
  "/notices",
  staff,
  [
    body("title").trim().notEmpty().withMessage("A title is required."),
    body("message").trim().notEmpty().withMessage("A message is required."),
    body("propertyId").optional({ nullable: true, checkFalsy: true }).isString(),
    body("tenantId").optional({ nullable: true, checkFalsy: true }).isString(),
    body("severity").optional().isIn(["INFO", "WARNING", "VACATE_NOTICE"]).withMessage("Invalid severity."),
  ],
  createNotice
);
router.get("/notices", staff, listForStaff);
router.delete("/notices/:noticeId", staff, deleteNotice);

router.get("/tenant/notices", requireAuth("tenant"), listOwnNotices);

module.exports = router;
