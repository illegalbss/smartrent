const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const {
  createComplaint,
  listOwnComplaints,
  listComplaintsForStaff,
  createComplaintForTenant,
  updateComplaintTriage,
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
router.post(
  "/tenants/:tenantId/complaints",
  requireStaff(),
  [body("message").trim().notEmpty().withMessage("A message is required.")],
  createComplaintForTenant
);
router.put("/complaints/:complaintId", requireStaff(), updateComplaintTriage);
router.put(
  "/complaints/:complaintId/respond",
  requireStaff(),
  [body("response").trim().notEmpty().withMessage("A response is required.")],
  respondToComplaint
);

module.exports = router;
