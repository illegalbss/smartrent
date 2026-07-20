const prisma = require("../config/prisma");
const { paystackRequest } = require("../services/paystackClient");

async function getPayoutStatus(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({
      where: { id: req.auth.id },
      select: {
        accountType: true,
        payoutBusinessName: true,
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutRcNumber: true,
        paystackSubaccountCode: true,
        payoutVerified: true,
      },
    });
    res.json({ success: true, data: landlord });
  } catch (err) {
    next(err);
  }
}

// Nigerian bank list, for the payout setup bank-selection dropdown.
async function listBanks(req, res, next) {
  try {
    const result = await paystackRequest("GET", "/bank?country=nigeria&currency=NGN");
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error });
    res.json({ success: true, data: result.data.map((b) => ({ name: b.name, code: b.code })) });
  } catch (err) {
    next(err);
  }
}

// Verifies the account number/bank pair resolves to a real account before we
// create the subaccount — catches typos before money starts flowing there.
async function resolveAccount(req, res, next) {
  try {
    const { accountNumber, bankCode } = req.query;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ success: false, error: "accountNumber and bankCode are required." });
    }
    const result = await paystackRequest("GET", `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`);
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error || "Could not verify this account." });
    res.json({ success: true, data: { accountName: result.data.account_name } });
  } catch (err) {
    next(err);
  }
}

// Sets up (or replaces) how this landlord gets paid — creates a Paystack
// Subaccount with percentage_charge: 0, since RentaFlow doesn't take a cut
// of rent payments under the flat-annual-license model. This still routes
// settlement directly to the landlord's own bank account, just with no fee.
async function setupPayout(req, res, next) {
  try {
    const { accountType, businessName, bankCode, accountNumber, rcNumber } = req.body;
    if (!accountType || !businessName || !bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: "Account type, business/full name, bank, and account number are all required.",
      });
    }
    if (!["INDIVIDUAL", "ORGANIZATION"].includes(accountType)) {
      return res.status(400).json({ success: false, error: "Invalid account type." });
    }

    const result = await paystackRequest("POST", "/subaccount", {
      business_name: businessName,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: 0,
    });
    if (!result.ok) return res.status(result.status).json({ success: false, error: result.error || "Could not set up payouts with Paystack." });

    const landlord = await prisma.landlord.update({
      where: { id: req.auth.id },
      data: {
        accountType,
        payoutBusinessName: businessName,
        payoutBankCode: bankCode,
        payoutAccountNumber: accountNumber,
        payoutRcNumber: rcNumber || null,
        paystackSubaccountCode: result.data.subaccount_code,
        payoutVerified: true,
      },
      select: {
        accountType: true,
        payoutBusinessName: true,
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutRcNumber: true,
        paystackSubaccountCode: true,
        payoutVerified: true,
      },
    });
    res.status(201).json({ success: true, data: landlord });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPayoutStatus, listBanks, resolveAccount, setupPayout };
