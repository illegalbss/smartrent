const { Router } = require("express");
const { requireStaff, requireAuth } = require("../middleware/auth");
const { logoutEverywhere, getReadNotifications, saveReadNotifications } = require("../controllers/sessionController");

const router = Router();

// The browser calls this when staff print a statement/report or export a CSV.
// The entry itself is written by middleware/staffActivity.js.
router.post("/activity/print", requireStaff(), (req, res) => res.json({ success: true }));

router.post("/auth/logout-all", requireAuth(), logoutEverywhere);
router.get("/notifications/read", requireAuth(), getReadNotifications);
router.put("/notifications/read", requireAuth(), saveReadNotifications);

module.exports = router;
