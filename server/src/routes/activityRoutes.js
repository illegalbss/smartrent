const { Router } = require("express");
const { requireStaff } = require("../middleware/auth");

const router = Router();

// The browser calls this when staff print a statement/report or export a CSV.
// The entry itself is written by middleware/staffActivity.js.
router.post("/activity/print", requireStaff(), (req, res) => res.json({ success: true }));

module.exports = router;
