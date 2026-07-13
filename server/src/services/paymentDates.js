// Rent is billed on the room/unit's rentFrequency (monthly/quarterly/yearly
// for a Store unit; yearly for a residential room). When a payment is
// recorded without an explicit coverage window, assume it covers one period
// starting from the payment date — this is the date "the payment should
// elapse", i.e. when the next one falls due.
function addInterval(date, frequency) {
  const result = new Date(date);
  if (frequency === "MONTHLY") result.setMonth(result.getMonth() + 1);
  else if (frequency === "QUARTERLY") result.setMonth(result.getMonth() + 3);
  else result.setFullYear(result.getFullYear() + 1); // YEARLY (default)
  return result;
}

function resolveCoverage({ datePaid, coverageStart, coverageEnd, rentFrequency = "YEARLY" }) {
  const start = coverageStart ? new Date(coverageStart) : new Date(datePaid);
  const end = coverageEnd ? new Date(coverageEnd) : addInterval(start, rentFrequency);
  return { coverageStart: start, coverageEnd: end };
}

module.exports = { resolveCoverage };
