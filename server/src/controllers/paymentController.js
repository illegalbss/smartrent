const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const { resolveCoverage } = require("../services/paymentDates");

async function getStaffName(staffId, staffRole) {
  if (staffRole === "LANDLORD") {
    const landlord = await prisma.landlord.findUnique({ where: { id: staffId }, select: { name: true } });
    return landlord?.name || "Unknown";
  }
  const secretary = await prisma.secretary.findUnique({ where: { id: staffId }, select: { name: true } });
  return secretary?.name || "Unknown";
}

// Decimal/Date instances aren't valid Prisma Json input as-is; round-trip
// through JSON to get plain, serializable values.
function toJsonSafe(value) {
  return value ? JSON.parse(JSON.stringify(value)) : undefined;
}

function logAudit({ paymentId, landlordId, action, staffId, staffRole, staffName, previousData, newData }) {
  return prisma.paymentAuditLog.create({
    data: {
      paymentId,
      landlordId,
      action,
      performedById: staffId,
      performedByRole: staffRole,
      performedByName: staffName,
      previousData: toJsonSafe(previousData),
      newData: toJsonSafe(newData),
    },
  });
}

async function createPayment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: { room: { select: { rentFrequency: true } } },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });
    if (!tenant.roomId) {
      return res.status(409).json({ success: false, error: "Tenant is not currently assigned to a room." });
    }

    const { amount, datePaid, coverageStart, coverageEnd, status, notes } = req.body;
    const staffName = await getStaffName(req.staffId, req.staffRole);
    const coverage = resolveCoverage({ datePaid, coverageStart, coverageEnd, rentFrequency: tenant.room.rentFrequency });

    const payment = await prisma.payment.create({
      data: {
        landlordId: req.landlordId,
        tenantId: tenant.id,
        roomId: tenant.roomId,
        amount,
        datePaid: new Date(datePaid),
        coverageStart: coverage.coverageStart,
        coverageEnd: coverage.coverageEnd,
        status: status || "PAID",
        notes,
        createdById: req.staffId,
        createdByRole: req.staffRole,
      },
    });

    await logAudit({
      paymentId: payment.id,
      landlordId: req.landlordId,
      action: "CREATED",
      staffId: req.staffId,
      staffRole: req.staffRole,
      staffName,
      newData: payment,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

async function listPaymentsForTenant(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const payments = await prisma.payment.findMany({
      where: { tenantId: tenant.id },
      orderBy: { datePaid: "desc" },
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}

async function updatePayment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: req.params.paymentId, landlordId: req.landlordId },
    });
    if (!payment) return res.status(404).json({ success: false, error: "Payment not found." });

    const { amount, datePaid, coverageStart, coverageEnd, status, notes } = req.body;
    const staffName = await getStaffName(req.staffId, req.staffRole);

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        ...(amount !== undefined && { amount }),
        ...(datePaid !== undefined && { datePaid: new Date(datePaid) }),
        ...(coverageStart !== undefined && { coverageStart: coverageStart ? new Date(coverageStart) : null }),
        ...(coverageEnd !== undefined && { coverageEnd: coverageEnd ? new Date(coverageEnd) : null }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAudit({
      paymentId: payment.id,
      landlordId: req.landlordId,
      action: "EDITED",
      staffId: req.staffId,
      staffRole: req.staffRole,
      staffName,
      previousData: payment,
      newData: updated,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deletePayment(req, res, next) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.paymentId, landlordId: req.landlordId },
    });
    if (!payment) return res.status(404).json({ success: false, error: "Payment not found." });

    const staffName = await getStaffName(req.staffId, req.staffRole);

    // Log before deleting; onDelete: SetNull on the relation preserves this
    // audit entry (with paymentId nulled out) once the payment row is gone.
    await logAudit({
      paymentId: payment.id,
      landlordId: req.landlordId,
      action: "DELETED",
      staffId: req.staffId,
      staffRole: req.staffRole,
      staffName,
      previousData: payment,
    });

    await prisma.payment.delete({ where: { id: payment.id } });
    res.json({ success: true, data: { message: "Payment deleted." } });
  } catch (err) {
    next(err);
  }
}

async function listAuditLog(req, res, next) {
  try {
    const logs = await prisma.paymentAuditLog.findMany({
      where: { landlordId: req.landlordId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

// Every payment recorded in a given calendar month, across all tenants —
// lets staff browse collections month by month instead of only "this month".
async function listMonthlyLedger(req, res, next) {
  try {
    const monthParam = req.query.month; // "YYYY-MM"
    const now = new Date();
    const [year, month] = monthParam
      ? monthParam.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: "Invalid month. Expected format YYYY-MM." });
    }

    const rangeStart = new Date(Date.UTC(year, month - 1, 1));
    const rangeEnd = new Date(Date.UTC(year, month, 1));

    const payments = await prisma.payment.findMany({
      where: { landlordId: req.landlordId, datePaid: { gte: rangeStart, lt: rangeEnd } },
      include: {
        tenant: {
          select: {
            name: true,
            room: { select: { roomNumber: true, property: { select: { name: true } } } },
          },
        },
      },
      orderBy: { datePaid: "desc" },
    });

    const totalCollected = payments
      .filter((p) => p.status !== "OWING")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      success: true,
      data: {
        month: `${year}-${String(month).padStart(2, "0")}`,
        totalCollected,
        count: payments.length,
        payments: payments.map((p) => ({
          id: p.id,
          tenantName: p.tenant.name,
          room: p.tenant.room ? `${p.tenant.room.roomNumber} — ${p.tenant.room.property.name}` : "Unassigned",
          amount: p.amount,
          datePaid: p.datePaid,
          status: p.status,
          source: p.source,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPayment,
  listPaymentsForTenant,
  updatePayment,
  deletePayment,
  listAuditLog,
  listMonthlyLedger,
};
