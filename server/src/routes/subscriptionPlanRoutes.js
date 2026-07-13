const { Router } = require("express");
const { listPlans } = require("../controllers/subscriptionPlanController");

const router = Router();

// Public — read-only. Used by the landlord signup plan-selector and the
// staff-side "upgrade your plan" prompt when a room/property limit is hit.
router.get("/plans", listPlans);

module.exports = router;
