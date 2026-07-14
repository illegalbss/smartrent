const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const storage = require("../services/storage");
const { summarizePayments } = require("../services/financeSummary");
const { computeTenantPaymentStatus } = require("../services/tenantPaymentStatus");
const { annualizedRent } = require("../services/rentFrequency");

function withPhotoFlag(property) {
  const { photoUrl, ...rest } = property;
  return { ...rest, hasPhoto: !!photoUrl };
}

async function listProperties(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: req.landlordId },
      include: { rooms: { select: { id: true, status: true, rentAmount: true, rentFrequency: true } } },
      orderBy: { createdAt: "desc" },
    });

    const allRoomIds = properties.flatMap((p) => p.rooms.map((r) => r.id));
    const roomToProperty = new Map(properties.flatMap((p) => p.rooms.map((r) => [r.id, p.id])));

    const [tenantsWithRooms, allPayments] = await Promise.all([
      allRoomIds.length
        ? prisma.tenant.findMany({
            where: { roomId: { in: allRoomIds } },
            select: {
              roomId: true,
              room: { select: { rentAmount: true } },
              payments: { orderBy: { datePaid: "desc" }, take: 1, select: { status: true, amount: true } },
            },
          })
        : Promise.resolve([]),
      // Actual payments, so "income" reflects real money collected — never a
      // projection from potential rent, which would show a number even for
      // a vacant room with zero tenants.
      allRoomIds.length
        ? prisma.payment.findMany({
            where: { roomId: { in: allRoomIds } },
            select: { roomId: true, amount: true, status: true, datePaid: true, source: true },
          })
        : Promise.resolve([]),
    ]);

    const tenantCountByProperty = new Map();
    const outstandingByProperty = new Map();
    for (const t of tenantsWithRooms) {
      const propertyId = roomToProperty.get(t.roomId);
      if (!propertyId) continue;
      tenantCountByProperty.set(propertyId, (tenantCountByProperty.get(propertyId) || 0) + 1);
      const { outstanding } = computeTenantPaymentStatus({ room: t.room, latestPayment: t.payments[0] || null });
      outstandingByProperty.set(propertyId, (outstandingByProperty.get(propertyId) || 0) + outstanding);
    }

    const paymentsByProperty = new Map();
    for (const payment of allPayments) {
      const propertyId = roomToProperty.get(payment.roomId);
      if (!propertyId) continue;
      if (!paymentsByProperty.has(propertyId)) paymentsByProperty.set(propertyId, []);
      paymentsByProperty.get(propertyId).push(payment);
    }

    const data = properties.map((p) => {
      const totalRooms = p.rooms.length;
      const occupiedRooms = p.rooms.filter((r) => r.status === "OCCUPIED").length;
      const { collectedThisMonth } = summarizePayments(paymentsByProperty.get(p.id) || []);
      const { rooms, ...rest } = p;
      return withPhotoFlag({
        ...rest,
        totalRooms,
        occupiedRooms,
        vacantRooms: totalRooms - occupiedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0,
        tenantCount: tenantCountByProperty.get(p.id) || 0,
        monthlyIncome: collectedThisMonth,
        outstanding: Math.round((outstandingByProperty.get(p.id) || 0) * 100) / 100,
      });
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Per-property mini-dashboard: occupancy and a full finance report (collections,
// trend, arrears) scoped to just this property's rooms — never combined with
// any other property, so a landlord always knows which building a number belongs to.
async function buildPropertyStats(property) {
  const roomIds = property.rooms.map((r) => r.id);
  const totalRooms = property.rooms.length;
  const occupiedRooms = property.rooms.filter((r) => r.status === "OCCUPIED").length;
  const annualRentExpected = property.rooms.reduce((sum, r) => sum + annualizedRent(r.rentAmount, r.rentFrequency), 0);

  const [payments, tenantsWithRooms] = await Promise.all([
    roomIds.length
      ? prisma.payment.findMany({ where: { roomId: { in: roomIds } }, select: { amount: true, status: true, datePaid: true, source: true } })
      : Promise.resolve([]),
    roomIds.length
      ? prisma.tenant.findMany({
          where: { roomId: { in: roomIds } },
          select: {
            id: true,
            name: true,
            room: { select: { roomNumber: true } },
            payments: { orderBy: { datePaid: "desc" }, take: 1, select: { status: true, datePaid: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const tenantIds = tenantsWithRooms.map((t) => t.id);

  const [openComplaints, pendingMaintenance, recentPaymentRows, recentComplaintRows] = await Promise.all([
    tenantIds.length ? prisma.complaint.count({ where: { tenantId: { in: tenantIds }, status: "OPEN" } }) : Promise.resolve(0),
    tenantIds.length ? prisma.maintenanceRequest.count({ where: { tenantId: { in: tenantIds }, status: "PENDING" } }) : Promise.resolve(0),
    roomIds.length
      ? prisma.payment.findMany({
          where: { roomId: { in: roomIds } },
          include: { tenant: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { datePaid: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    tenantIds.length
      ? prisma.complaint.findMany({
          where: { tenantId: { in: tenantIds } },
          include: { tenant: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const tenantsInArrears = tenantsWithRooms
    .filter((t) => !t.payments[0] || t.payments[0].status !== "PAID")
    .map((t) => ({
      tenantId: t.id,
      name: t.name,
      room: t.room?.roomNumber || null,
      lastPaymentStatus: t.payments[0]?.status || "NO_PAYMENTS",
      lastPaymentDate: t.payments[0]?.datePaid || null,
    }));

  const recentPayments = recentPaymentRows.map((p) => ({
    id: p.id,
    tenantId: p.tenant.id,
    tenantName: p.tenant.name,
    tenantHasPhoto: !!p.tenant.photoUrl,
    amount: p.amount,
    datePaid: p.datePaid,
    source: p.source,
    status: p.status,
  }));

  const recentComplaints = recentComplaintRows.map((c) => ({
    id: c.id,
    tenantId: c.tenant.id,
    tenantName: c.tenant.name,
    message: c.message,
    status: c.status,
    createdAt: c.createdAt,
  }));

  return {
    totalRooms,
    occupiedRooms,
    vacantRooms: totalRooms - occupiedRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0,
    tenantCount: tenantsWithRooms.length,
    annualRentExpected: Math.round(annualRentExpected * 100) / 100,
    openComplaints,
    pendingMaintenance,
    ...summarizePayments(payments),
    tenantsInArrears,
    recentPayments,
    recentComplaints,
  };
}

async function getProperty(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
      include: {
        rooms: {
          include: {
            tenants: {
              select: { id: true, name: true, email: true, phone: true, photoUrl: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { roomNumber: "asc" },
        },
      },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const stats = await buildPropertyStats(property);
    res.json({ success: true, data: { ...withPhotoFlag(property), stats } });
  } catch (err) {
    next(err);
  }
}

async function createProperty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { name, address, ownershipType, propertyType } = req.body;
    const property = await prisma.property.create({
      data: {
        name,
        address,
        ownershipType: ownershipType || "PERSONAL",
        propertyType: propertyType || "RESIDENTIAL",
        landlordId: req.auth.id,
      },
    });
    res.status(201).json({ success: true, data: withPhotoFlag(property) });
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.auth.id },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const { name, address, ownershipType } = req.body;
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(ownershipType !== undefined && { ownershipType }),
      },
    });
    res.json({ success: true, data: withPhotoFlag(updated) });
  } catch (err) {
    next(err);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.auth.id },
      include: { rooms: true },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const hasOccupiedRoom = property.rooms.some((r) => r.status !== "VACANT");
    if (hasOccupiedRoom) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete a property with an occupied room. Offboard tenants first.",
      });
    }

    if (property.photoUrl) await storage.removeFile(property.photoUrl);
    await prisma.property.delete({ where: { id: property.id } });
    res.json({ success: true, data: { message: "Property deleted." } });
  } catch (err) {
    next(err);
  }
}

// Staff-only: upload/replace the property's photo.
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "A photo file is required." });

    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const photoUrl = await storage.saveBuffer(`property-${property.id}`, req.file.originalname, req.file.buffer, req.file.mimetype);
    if (property.photoUrl) await storage.removeFile(property.photoUrl);

    await prisma.property.update({ where: { id: property.id }, data: { photoUrl } });
    res.status(201).json({ success: true, data: { hasPhoto: true } });
  } catch (err) {
    next(err);
  }
}

// Staff-only: stream the property's photo inline.
async function getPhoto(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
    });
    if (!property || !property.photoUrl) return res.status(404).json({ success: false, error: "No photo on file." });

    const { buffer, contentType } = await storage.getFile(property.photoUrl);
    res.set("Content-Type", contentType || "image/jpeg");
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPhoto,
  getPhoto,
};
