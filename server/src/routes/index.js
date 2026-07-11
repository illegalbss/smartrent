const { Router } = require("express");
const landlordAuthRoutes = require("./landlordAuthRoutes");
const secretaryAuthRoutes = require("./secretaryAuthRoutes");
const propertyRoutes = require("./propertyRoutes");
const roomRoutes = require("./roomRoutes");
const tenantRoutes = require("./tenantRoutes");
const tenantAuthRoutes = require("./tenantAuthRoutes");
const paymentRoutes = require("./paymentRoutes");
const complaintRoutes = require("./complaintRoutes");
const documentRoutes = require("./documentRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const paystackRoutes = require("./paystackRoutes");
const maintenanceRoutes = require("./maintenanceRoutes");
const noticeRoutes = require("./noticeRoutes");
const houseRulesRoutes = require("./houseRulesRoutes");

const router = Router();

router.get("/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
router.use(landlordAuthRoutes);
router.use(secretaryAuthRoutes);
router.use(propertyRoutes);
router.use(roomRoutes);
router.use(tenantRoutes);
router.use(tenantAuthRoutes);
router.use(paymentRoutes);
router.use(complaintRoutes);
router.use(documentRoutes);
router.use(dashboardRoutes);
router.use(paystackRoutes);
router.use(maintenanceRoutes);
router.use(noticeRoutes);
router.use(houseRulesRoutes);

module.exports = router;
