// What a tenant currently owes and when their next payment falls due, derived
// from their room's rent and their most recent payment record. Used by the
// tenant's own dashboard, the staff tenant list/cards, and the due-date
// reminder shown in the notification bell — so all three stay consistent.
function computeTenantPaymentStatus({ room, latestPayment, fallbackDueDate, now = new Date() }) {
  if (!room) {
    return { outstanding: 0, nextDueDate: null, lastPaymentStatus: null, daysUntilDue: null, isOverdue: false };
  }

  const rentAmount = Number(room.rentAmount);
  let outstanding = rentAmount;
  let lastPaymentStatus = null;
  let nextDueDate = null;

  if (latestPayment) {
    lastPaymentStatus = latestPayment.status;
    if (latestPayment.status === "PAID") outstanding = 0;
    else if (latestPayment.status === "PARTIAL") outstanding = Math.max(rentAmount - Number(latestPayment.amount), 0);
    nextDueDate = latestPayment.coverageEnd || null;
  }

  if (!nextDueDate && fallbackDueDate) nextDueDate = fallbackDueDate;

  let daysUntilDue = null;
  let isOverdue = false;
  if (nextDueDate) {
    daysUntilDue = Math.ceil((new Date(nextDueDate).getTime() - now.getTime()) / 86400000);
    isOverdue = daysUntilDue < 0;
  }

  return {
    outstanding: Math.round(outstanding * 100) / 100,
    nextDueDate,
    lastPaymentStatus,
    daysUntilDue,
    isOverdue,
  };
}

module.exports = { computeTenantPaymentStatus };
