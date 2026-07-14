const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { getPayoutStatus, listBanks, resolveAccount, setupPayout } = require("../controllers/payoutController");

const router = Router();
// Landlord-only, like other financial/setup actions in this app — payout
// details are sensitive enough that Secretaries shouldn't touch them.
const landlordOnly = requireAuth("landlord");

router.get("/landlord/payout", landlordOnly, getPayoutStatus);
router.get("/landlord/payout/banks", landlordOnly, listBanks);
router.get("/landlord/payout/resolve-account", landlordOnly, resolveAccount);
router.post("/landlord/payout", landlordOnly, setupPayout);

module.exports = router;
