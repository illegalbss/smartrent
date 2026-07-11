const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const { listForStaff, upsertRules, deleteRules, getOwnRules } = require("../controllers/houseRulesController");

const router = Router();
const staff = requireStaff();

router.get("/house-rules", staff, listForStaff);
router.put(
  "/house-rules",
  staff,
  [
    body("content").trim().notEmpty().withMessage("Rules content is required."),
    body("propertyId").optional({ nullable: true, checkFalsy: true }).isString(),
  ],
  upsertRules
);
router.delete("/house-rules/:rulesId", staff, deleteRules);

router.get("/tenant/house-rules", requireAuth("tenant"), getOwnRules);

module.exports = router;
