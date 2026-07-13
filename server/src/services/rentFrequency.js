// Shared conversion so every place that sums or compares rent across rooms
// does it correctly regardless of each room's billing cycle — a Store unit
// can be MONTHLY/QUARTERLY while a residential room is YEARLY.
const PERIODS_PER_YEAR = { MONTHLY: 12, QUARTERLY: 4, YEARLY: 1 };
const FREQUENCY_LABEL = { MONTHLY: "month", QUARTERLY: "quarter", YEARLY: "year" };

function annualizedRent(rentAmount, rentFrequency = "YEARLY") {
  return Number(rentAmount) * (PERIODS_PER_YEAR[rentFrequency] || 1);
}

function frequencyLabel(rentFrequency = "YEARLY") {
  return FREQUENCY_LABEL[rentFrequency] || "year";
}

module.exports = { annualizedRent, frequencyLabel, PERIODS_PER_YEAR };
