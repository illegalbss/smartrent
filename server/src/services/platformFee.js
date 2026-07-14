// RentaFlow keeps 1% of every online rent payment, capped at ₦25,000 —
// Paystack's percentage-split has no built-in cap, so above the cap we must
// override with a fixed-amount split instead of letting the percentage apply.
const FEE_RATE = 0.01;
const FEE_CAP = 25000;

function calculatePlatformFee(amountNaira) {
  return Math.round(Math.min(amountNaira * FEE_RATE, FEE_CAP) * 100) / 100;
}

// Paystack transaction-charge overrides are passed in kobo.
function calculatePlatformFeeKobo(amountNaira) {
  return Math.round(calculatePlatformFee(amountNaira) * 100);
}

module.exports = { calculatePlatformFee, calculatePlatformFeeKobo, FEE_RATE, FEE_CAP };
