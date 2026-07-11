const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const { createRequest, listOwnRequests, listForStaff, updateStatus } = require("../controllers/maintenanceController");

const router = Router();
const staff = requireStaff();

router.post(
  "/tenant/maintenance",
  requireAuth("tenant"),
  [
    body("title").trim().notEmpty().withMessage("A short title is required."),
    body("description").trim().notEmpty().withMessage("A description is required."),
  ],
  createRequest
);
router.get("/tenant/maintenance", requireAuth("tenant"), listOwnRequests);

router.get("/maintenance", staff, listForStaff);
router.put(
  "/maintenance/:requestId",
  staff,
  [body("status").isIn(["PENDING", "IN_PROGRESS", "COMPLETED"]).withMessage("Invalid status.")],
  updateStatus
);

module.exports = router;
