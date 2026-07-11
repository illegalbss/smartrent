// Shared by the portfolio-wide dashboard and each property's own finance
// report — same shape, scoped to whichever set of payments the caller passes in.
function summarizePayments(payments) {
  const byStatus = {
    PAID: { count: 0, total: 0 },
    PARTIAL: { count: 0, total: 0 },
    OWING: { count: 0, total: 0 },
  };
  const bySource = {
    MANUAL: { count: 0, total: 0 },
    PAYSTACK: { count: 0, total: 0 },
  };

  const now = new Date();
  let totalCollected = 0;
  let collectedThisMonth = 0;

  for (const payment of payments) {
    const amount = Number(payment.amount);
    byStatus[payment.status].count += 1;
    byStatus[payment.status].total += amount;

    if (payment.status !== "OWING") {
      totalCollected += amount;
      bySource[payment.source].count += 1;
      bySource[payment.source].total += amount;
      const paidDate = new Date(payment.datePaid);
      if (paidDate.getFullYear() === now.getFullYear() && paidDate.getMonth() === now.getMonth()) {
        collectedThisMonth += amount;
      }
    }
  }

  // Last 6 months of collections, oldest first, for the income trend chart.
  const monthlySeries = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const label = monthDate.toLocaleDateString("en-NG", { month: "short", year: "2-digit", timeZone: "UTC" });
    const total = payments
      .filter((p) => {
        if (p.status === "OWING") return false;
        const d = new Date(p.datePaid);
        return d.getUTCFullYear() === monthDate.getUTCFullYear() && d.getUTCMonth() === monthDate.getUTCMonth();
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    monthlySeries.push({ month: label, total: Math.round(total * 100) / 100 });
  }

  return {
    totalCollected: Math.round(totalCollected * 100) / 100,
    collectedThisMonth: Math.round(collectedThisMonth * 100) / 100,
    totalOwing: Math.round(byStatus.OWING.total * 100) / 100,
    byStatus,
    bySource,
    monthlySeries,
  };
}

module.exports = { summarizePayments };
