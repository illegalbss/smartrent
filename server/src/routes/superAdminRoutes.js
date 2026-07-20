const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  listLandlords,
  getLandlord,
  createLandlord,
  updateLandlord,
  deactivateLandlord,
  reactivateLandlord,
  deleteLandlord,
  getRevenue,
  listTransactions,
  getPlatformStats,
} = require("../controllers/superAdminController");
const { listPlans, updatePlan, createPlan } = require("../controllers/subscriptionPlanController");

const router = Router();
const admin = requireAuth("superadmin");

router.get("/superadmin/stats", admin, getPlatformStats);
router.get("/superadmin/revenue", admin, getRevenue);
router.get("/superadmin/transactions", admin, listTransactions);

router.get("/superadmin/landlords", admin, listLandlords);
router.get("/superadmin/landlords/:landlordId", admin, getLandlord);
router.post("/superadmin/landlords", admin, createLandlord);
router.put("/superadmin/landlords/:landlordId", admin, updateLandlord);
router.post("/superadmin/landlords/:landlordId/deactivate", admin, deactivateLandlord);
router.post("/superadmin/landlords/:landlordId/reactivate", admin, reactivateLandlord);
router.delete("/superadmin/landlords/:landlordId", admin, deleteLandlord);

router.get("/superadmin/plans", admin, listPlans);
router.post("/superadmin/plans", admin, createPlan);
router.put("/superadmin/plans/:planId", admin, updatePlan);

module.exports = router;
