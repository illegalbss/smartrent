const prisma = require("../config/prisma");

function emptyBucket() {
  return { totalProperties: 0, totalRooms: 0, occupiedRooms: 0, vacantRooms: 0, occupancyRate: 0 };
}

async function buildFinanceSummary(landlordId) {
  const payments = await prisma.payment.findMany({
    where: { landlordId },
    select: { amount: true, status: true, datePaid: true, source: true },
  });

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

  // Tenants whose most recent payment is missing, partial, or flagged owing — currently in arrears.
  const tenantsWithRooms = await prisma.tenant.findMany({
    where: { landlordId, roomId: { not: null } },
    select: {
      id: true,
      name: true,
      room: { select: { roomNumber: true, property: { select: { name: true } } } },
      payments: { orderBy: { datePaid: "desc" }, take: 1, select: { status: true, datePaid: true, amount: true } },
    },
  });

  const inArrears = tenantsWithRooms
    .filter((t) => !t.payments[0] || t.payments[0].status !== "PAID")
    .map((t) => ({
      tenantId: t.id,
      name: t.name,
      room: t.room ? `${t.room.roomNumber} — ${t.room.property.name}` : null,
      lastPaymentStatus: t.payments[0]?.status || "NO_PAYMENTS",
      lastPaymentDate: t.payments[0]?.datePaid || null,
    }));

  return {
    totalCollected: Math.round(totalCollected * 100) / 100,
    collectedThisMonth: Math.round(collectedThisMonth * 100) / 100,
    totalOwing: Math.round(byStatus.OWING.total * 100) / 100,
    byStatus,
    bySource,
    tenantsInArrears: inArrears,
  };
}

// Occupancy across all properties, grouped by ownership type (Organization vs. Personal).
async function getDashboard(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: req.landlordId },
      include: { rooms: { select: { status: true } } },
    });

    const byOwnership = { ORGANIZATION: emptyBucket(), PERSONAL: emptyBucket() };
    const overall = emptyBucket();

    for (const property of properties) {
      const bucket = byOwnership[property.ownershipType];
      bucket.totalProperties += 1;
      overall.totalProperties += 1;

      for (const room of property.rooms) {
        bucket.totalRooms += 1;
        overall.totalRooms += 1;
        if (room.status === "OCCUPIED") {
          bucket.occupiedRooms += 1;
          overall.occupiedRooms += 1;
        } else {
          bucket.vacantRooms += 1;
          overall.vacantRooms += 1;
        }
      }
    }

    for (const bucket of [byOwnership.ORGANIZATION, byOwnership.PERSONAL, overall]) {
      bucket.occupancyRate = bucket.totalRooms > 0 ? Math.round((bucket.occupiedRooms / bucket.totalRooms) * 1000) / 10 : 0;
    }

    const [openComplaints, tenantCount, finance] = await Promise.all([
      prisma.complaint.count({ where: { landlordId: req.landlordId, status: "OPEN" } }),
      prisma.tenant.count({ where: { landlordId: req.landlordId } }),
      buildFinanceSummary(req.landlordId),
    ]);

    res.json({
      success: true,
      data: {
        overall,
        byOwnership: { organization: byOwnership.ORGANIZATION, personal: byOwnership.PERSONAL },
        openComplaints,
        totalTenants: tenantCount,
        finance,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
