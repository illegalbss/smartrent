const { Router } = require("express");
const { requireStaff } = require("../middleware/auth");
const { getDashboard } = require("../controllers/dashboardController");

const router = Router();

router.get("/dashboard", requireStaff(), getDashboard);

module.exports = router;
