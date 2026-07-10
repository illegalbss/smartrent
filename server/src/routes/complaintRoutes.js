const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const {
  createComplaint,
  listOwnComplaints,
  listComplaintsForStaff,
  respondToComplaint,
} = require("../controllers/complaintController");

const router = Router();

router.post(
  "/tenant/complaints",
  requireAuth("tenant"),
  [body("message").trim().notEmpty().withMessage("A message is required.")],
  createComplaint
);
router.get("/tenant/complaints", requireAuth("tenant"), listOwnComplaints);

router.get("/complaints", requireStaff(), listComplaintsForStaff);
router.put(
  "/complaints/:complaintId/respond",
  requireStaff(),
  [body("response").trim().notEmpty().withMessage("A response is required.")],
  respondToComplaint
);

module.exports = router;
