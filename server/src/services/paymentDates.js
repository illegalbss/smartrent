// Rent is billed annually ("per annum"). When a payment is recorded without
// an explicit coverage window, assume it covers one year starting from the
// payment date — this is the date "the payment should elapse", i.e. when the
// next one falls due.
function resolveCoverage({ datePaid, coverageStart, coverageEnd }) {
  const start = coverageStart ? new Date(coverageStart) : new Date(datePaid);
  let end;
  if (coverageEnd) {
    end = new Date(coverageEnd);
  } else {
    end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
  }
  return { coverageStart: start, coverageEnd: end };
}

module.exports = { resolveCoverage };
