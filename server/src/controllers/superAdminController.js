const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const prisma = require("../config/prisma");

// Above this, the Super Admin dashboard flags storage usage as a warning —
// Cloudinary's free tier suspends uploads once the monthly credit pool runs
// out rather than overage-billing, so this is worth catching before it bites.
const STORAGE_WARNING_THRESHOLD = 80;

function sanitizeLandlord(landlord) {
  const { passwordHash, ...rest } = landlord;
  return rest;
}

// Every landlord on the platform, with the counts, billing info, and
// per-property breakdown the Super Admin needs — never scoped to one
// landlord, unlike every other controller in this app.
async function listLandlords(req, res, next) {
  try {
    const landlords = await prisma.landlord.findMany({
      include: {
        plan: true,
        properties: {
          select: { id: true, name: true, propertyType: true, rooms: { select: { id: true, status: true } } },
          orderBy: { createdAt: "desc" },
        },
        tenants: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = landlords.map((l) => {
      const totalProperties = l.properties.length;
      const totalRooms = l.properties.reduce((sum, p) => sum + p.rooms.length, 0);
      const totalStores = l.properties.filter((p) => p.propertyType === "COMMERCIAL").length;
      const propertyBreakdown = l.properties.map((p) => ({
        id: p.id,
        name: p.name,
        propertyType: p.propertyType,
        totalRooms: p.rooms.length,
        occupiedRooms: p.rooms.filter((r) => r.status === "OCCUPIED").length,
      }));
      const { properties, tenants, ...rest } = l;
      return {
        ...sanitizeLandlord(rest),
        totalProperties,
        totalRooms,
        totalStores,
        totalTenants: tenants.length,
        properties: propertyBreakdown,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getLandlord(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({
      where: { id: req.params.landlordId },
      include: {
        plan: true,
        properties: { select: { id: true, rooms: { select: { id: true } } } },
        tenants: { select: { id: true } },
        billingTransactions: { orderBy: { createdAt: "desc" }, take: 20, include: { plan: true } },
      },
    });
    if (!landlord) return res.status(404).json({ success: false, error: "Landlord not found." });

    const totalProperties = landlord.properties.length;
    const totalRooms = landlord.properties.reduce((sum, p) => sum + p.rooms.length, 0);
    const { properties, tenants, ...rest } = landlord;

    res.json({
      success: true,
      data: { ...sanitizeLandlord(rest), totalProperties, totalRooms, totalTenants: tenants.length },
    });
  } catch (err) {
    next(err);
  }
}

// Support/manual account creation — bypasses the (future) plan-selection +
// Paystack signup flow. Defaults to ACTIVE with no plan assigned.
async function createLandlord(req, res, next) {
  try {
    const { name, email, password, phone, planId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required." });
    }

    const existing = await prisma.landlord.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const landlord = await prisma.landlord.create({
      data: { name, email: email.toLowerCase(), passwordHash, phone, planId: planId || null },
      include: { plan: true },
    });
    res.status(201).json({ success: true, data: sanitizeLandlord(landlord) });
  } catch (err) {
    next(err);
  }
}

// General edit — name/phone/plan/subscriptionStatus/nextBillingDate. Used
// for support fixes (e.g. manually marking a landlord active after an
// off-platform payment, or moving them to a different plan).
async function updateLandlord(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: req.params.landlordId } });
    if (!landlord) return res.status(404).json({ success: false, error: "Landlord not found." });

    const { name, phone, planId, subscriptionStatus, nextBillingDate, automaticPaymentsEnabled } = req.body;
    const updated = await prisma.landlord.update({
      where: { id: landlord.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(planId !== undefined && { planId: planId || null }),
        ...(subscriptionStatus !== undefined && { subscriptionStatus }),
        ...(nextBillingDate !== undefined && { nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null }),
        ...(automaticPaymentsEnabled !== undefined && { automaticPaymentsEnabled }),
      },
      include: { plan: true },
    });
    res.json({ success: true, data: sanitizeLandlord(updated) });
  } catch (err) {
    next(err);
  }
}

// Deactivate/reactivate — sets subscriptionStatus, which the staff-auth
// middleware checks to block write access platform-wide.
async function deactivateLandlord(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: req.params.landlordId } });
    if (!landlord) return res.status(404).json({ success: false, error: "Landlord not found." });

    const updated = await prisma.landlord.update({
      where: { id: landlord.id },
      data: { subscriptionStatus: "CANCELED" },
      include: { plan: true },
    });
    res.json({ success: true, data: sanitizeLandlord(updated) });
  } catch (err) {
    next(err);
  }
}

async function reactivateLandlord(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: req.params.landlordId } });
    if (!landlord) return res.status(404).json({ success: false, error: "Landlord not found." });

    const updated = await prisma.landlord.update({
      where: { id: landlord.id },
      data: { subscriptionStatus: "ACTIVE" },
      include: { plan: true },
    });
    res.json({ success: true, data: sanitizeLandlord(updated) });
  } catch (err) {
    next(err);
  }
}

// Permanent — cascades to every property, room, tenant, payment, document,
// etc. under this landlord (see the onDelete: Cascade relations in
// schema.prisma). Deactivate instead unless the account should truly be gone.
async function deleteLandlord(req, res, next) {
  try {
    const landlord = await prisma.landlord.findUnique({ where: { id: req.params.landlordId } });
    if (!landlord) return res.status(404).json({ success: false, error: "Landlord not found." });

    await prisma.landlord.delete({ where: { id: landlord.id } });
    res.json({ success: true, data: { message: "Landlord permanently deleted." } });
  } catch (err) {
    next(err);
  }
}

// Monthly + historical revenue, and overall platform stats — computed from
// successful billing transactions only.
async function getRevenue(req, res, next) {
  try {
    const transactions = await prisma.billingTransaction.findMany({
      where: { status: "SUCCESS" },
      select: { amount: true, createdAt: true },
    });

    const now = new Date();
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const monthlyRevenue = transactions
      .filter((t) => t.createdAt.getFullYear() === now.getFullYear() && t.createdAt.getMonth() === now.getMonth())
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Last 12 months, oldest first.
    const monthlySeries = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const label = monthDate.toLocaleDateString("en-NG", { month: "short", year: "2-digit", timeZone: "UTC" });
      const total = transactions
        .filter((t) => {
          const d = t.createdAt;
          return d.getUTCFullYear() === monthDate.getUTCFullYear() && d.getUTCMonth() === monthDate.getUTCMonth();
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);
      monthlySeries.push({ month: label, total });
    }

    res.json({ success: true, data: { totalRevenue, monthlyRevenue, monthlySeries } });
  } catch (err) {
    next(err);
  }
}

async function listTransactions(req, res, next) {
  try {
    const transactions = await prisma.billingTransaction.findMany({
      include: { landlord: { select: { name: true, email: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
}

async function getPlatformStats(req, res, next) {
  try {
    const [totalLandlords, activeLandlords, totalRooms] = await Promise.all([
      prisma.landlord.count(),
      prisma.landlord.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.room.count(),
    ]);
    res.json({ success: true, data: { totalLandlords, activeLandlords, totalRooms } });
  } catch (err) {
    next(err);
  }
}

// Cloudinary's free tier suspends uploads once the monthly credit pool is
// used up (no overage billing) — this surfaces that before it happens.
async function getStorageUsage(req, res, next) {
  try {
    const usage = await cloudinary.api.usage();
    const usedPercent = usage.credits?.used_percent ?? (usage.credits ? (usage.credits.usage / usage.credits.limit) * 100 : 0);
    res.json({
      success: true,
      data: {
        plan: usage.plan,
        creditsUsed: usage.credits?.usage ?? null,
        creditsLimit: usage.credits?.limit ?? null,
        usedPercent: Math.round(usedPercent * 10) / 10,
        storageBytes: usage.storage?.usage ?? null,
        bandwidthBytes: usage.bandwidth?.usage ?? null,
        objectCount: usage.objects?.usage ?? null,
        warning: usedPercent >= STORAGE_WARNING_THRESHOLD,
      },
    });
  } catch (err) {
    // Cloudinary being unreachable shouldn't break the rest of the admin
    // dashboard — report it as a soft failure the UI can show inline.
    res.json({ success: true, data: null, error: "Could not reach Cloudinary to check usage." });
  }
}

// Login/action history across every landlord and secretary — filterable by
// role and/or a specific landlord account, so a Super Admin can trace a
// secretary's activity back to which landlord they work for.
async function listActivityLogs(req, res, next) {
  try {
    const { role, landlordId } = req.query;
    const logs = await prisma.activityLog.findMany({
      where: {
        ...(role && ["LANDLORD", "SECRETARY"].includes(role) && { userRole: role }),
        ...(landlordId && { landlordId }),
      },
      include: { landlord: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLandlords,
  getLandlord,
  createLandlord,
  updateLandlord,
  deactivateLandlord,
  reactivateLandlord,
  deleteLandlord,
  getRevenue,
  listTransactions,
  getPlatformStats,
  getStorageUsage,
  listActivityLogs,
};
