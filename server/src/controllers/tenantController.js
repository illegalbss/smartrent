const crypto = require("crypto");
const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const storage = require("../services/storage");
const { computeTenantPaymentStatus } = require("../services/tenantPaymentStatus");
const { summarizePayments } = require("../services/financeSummary");

function sanitize(tenant) {
  const { passwordHash, inviteToken, photoUrl, ...rest } = tenant;
  return { ...rest, hasPhoto: !!photoUrl };
}

// Table view per the brief: S/N (frontend), Name, Room, Date Packed In,
// Date of Last Payment, Coverage of Payment, Date of Expiration, Phone.
function toTableRow(tenant) {
  const lastPayment = tenant.payments[0] || null;
  const paymentStatus = computeTenantPaymentStatus({
    room: tenant.room,
    latestPayment: lastPayment,
    fallbackDueDate: tenant.dateCommencement,
  });
  return {
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    hasPhoto: !!tenant.photoUrl,
    occupantType: tenant.occupantType,
    businessName: tenant.businessName,
    room: tenant.room
      ? {
          id: tenant.room.id,
          roomNumber: tenant.room.roomNumber,
          propertyName: tenant.room.property.name,
          propertyType: tenant.room.property.propertyType,
        }
      : null,
    dateCommencement: tenant.dateCommencement,
    dateExpiration: tenant.dateExpiration,
    dateRenewal: tenant.dateRenewal,
    dateOfLastPayment: lastPayment?.datePaid || null,
    lastPaymentAmount: lastPayment?.amount || null,
    lastPaymentStatus: lastPayment?.status || null,
    coverageOfPayment: lastPayment ? { start: lastPayment.coverageStart, end: lastPayment.coverageEnd } : null,
    inviteAcceptedAt: tenant.inviteAcceptedAt,
    outstanding: paymentStatus.outstanding,
    nextDueDate: paymentStatus.nextDueDate,
    daysUntilDue: paymentStatus.daysUntilDue,
    isOverdue: paymentStatus.isOverdue,
  };
}

async function registerTenant(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const {
      name,
      email,
      phone,
      roomId,
      dateCommencement,
      dateExpiration,
      dateRenewal,
      securityDeposit,
      occupantType,
      businessName,
      cacNumber,
      nextOfKinName,
      nextOfKinPhone,
    } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ success: false, error: "A tenant with this email already exists." });
    }

    // Occupant type follows the room's property: a room on a Commercial
    // property is rented to a Shop Owner, Residential to a Tenant — so the
    // UI never has to ask separately, it just adapts to which room is picked.
    let room = null;
    let resolvedOccupantType = occupantType || "RESIDENTIAL_TENANT";
    if (roomId) {
      room = await prisma.room.findFirst({
        where: { id: roomId, property: { landlordId: req.landlordId } },
        include: { property: { select: { propertyType: true } } },
      });
      if (!room) return res.status(404).json({ success: false, error: "Room not found." });
      if (room.status === "OCCUPIED") {
        return res.status(409).json({ success: false, error: "This room already has a tenant." });
      }
      resolvedOccupantType = room.property.propertyType === "COMMERCIAL" ? "SHOP_OWNER" : "RESIDENTIAL_TENANT";
    }

    const inviteToken = crypto.randomBytes(24).toString("hex");
    const tenant = await prisma.tenant.create({
      data: {
        landlordId: req.landlordId,
        roomId: room?.id || null,
        occupantType: resolvedOccupantType,
        name,
        email: email.toLowerCase(),
        phone,
        dateCommencement: dateCommencement ? new Date(dateCommencement) : null,
        dateExpiration: dateExpiration ? new Date(dateExpiration) : null,
        dateRenewal: dateRenewal ? new Date(dateRenewal) : null,
        securityDeposit: securityDeposit || null,
        businessName: businessName || null,
        cacNumber: cacNumber || null,
        nextOfKinName: nextOfKinName || null,
        nextOfKinPhone: nextOfKinPhone || null,
        inviteToken,
        registeredById: req.staffId,
        registeredByRole: req.staffRole,
      },
    });

    if (room) {
      await prisma.room.update({ where: { id: room.id }, data: { status: "OCCUPIED" } });
    }

    // In production this token is dispatched via email/SMS, not returned in the response.
    res.status(201).json({ success: true, data: { ...sanitize(tenant), inviteToken } });
  } catch (err) {
    next(err);
  }
}

async function listTenants(req, res, next) {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const propertyId = req.query.propertyId;

    const where = {
      landlordId: req.landlordId,
      ...(propertyId && { room: { propertyId } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { room: { roomNumber: { contains: search, mode: "insensitive" } } },
          { room: { property: { name: { contains: search, mode: "insensitive" } } } },
        ],
      }),
    };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          room: { include: { property: { select: { name: true, propertyType: true } } } },
          payments: { orderBy: { datePaid: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      success: true,
      data: tenants.map(toTableRow),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
}

async function getTenant(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: {
        room: { include: { property: { select: { name: true, address: true, propertyType: true } } } },
        payments: { orderBy: { datePaid: "desc" } },
        documents: true,
      },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const paymentStatus = computeTenantPaymentStatus({
      room: tenant.room,
      latestPayment: tenant.payments[0] || null,
      fallbackDueDate: tenant.dateCommencement,
    });
    const finance = summarizePayments(tenant.payments);

    res.json({ success: true, data: { ...sanitize(tenant), paymentStatus, finance } });
  } catch (err) {
    next(err);
  }
}

async function updateTenant(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const tenant = await prisma.tenant.findFirst({ where: { id: req.params.tenantId, landlordId: req.landlordId } });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const {
      name,
      phone,
      dateCommencement,
      dateExpiration,
      dateRenewal,
      roomId,
      securityDeposit,
      businessName,
      cacNumber,
      nextOfKinName,
      nextOfKinPhone,
    } = req.body;

    // Handle room reassignment: free the old room, occupy the new one, and
    // re-derive occupantType from the new room's property (a tenant moving
    // into a Commercial unit becomes a Shop Owner, and vice versa).
    let occupantTypeUpdate;
    if (roomId !== undefined && roomId !== tenant.roomId) {
      if (roomId) {
        const newRoom = await prisma.room.findFirst({
          where: { id: roomId, property: { landlordId: req.landlordId } },
          include: { property: { select: { propertyType: true } } },
        });
        if (!newRoom) return res.status(404).json({ success: false, error: "Room not found." });
        if (newRoom.status === "OCCUPIED") {
          return res.status(409).json({ success: false, error: "This room already has a tenant." });
        }
        await prisma.room.update({ where: { id: newRoom.id }, data: { status: "OCCUPIED" } });
        occupantTypeUpdate = newRoom.property.propertyType === "COMMERCIAL" ? "SHOP_OWNER" : "RESIDENTIAL_TENANT";
      }
      if (tenant.roomId) {
        await prisma.room.update({ where: { id: tenant.roomId }, data: { status: "VACANT" } });
      }
    }

    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(dateCommencement !== undefined && { dateCommencement: dateCommencement ? new Date(dateCommencement) : null }),
        ...(dateExpiration !== undefined && { dateExpiration: dateExpiration ? new Date(dateExpiration) : null }),
        ...(dateRenewal !== undefined && { dateRenewal: dateRenewal ? new Date(dateRenewal) : null }),
        ...(roomId !== undefined && { roomId: roomId || null }),
        ...(occupantTypeUpdate !== undefined && { occupantType: occupantTypeUpdate }),
        ...(securityDeposit !== undefined && { securityDeposit: securityDeposit || null }),
        ...(businessName !== undefined && { businessName: businessName || null }),
        ...(cacNumber !== undefined && { cacNumber: cacNumber || null }),
        ...(nextOfKinName !== undefined && { nextOfKinName: nextOfKinName || null }),
        ...(nextOfKinPhone !== undefined && { nextOfKinPhone: nextOfKinPhone || null }),
      },
    });
    res.json({ success: true, data: sanitize(updated) });
  } catch (err) {
    next(err);
  }
}

async function offboardTenant(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({ where: { id: req.params.tenantId, landlordId: req.landlordId } });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    if (tenant.roomId) {
      await prisma.room.update({ where: { id: tenant.roomId }, data: { status: "VACANT" } });
    }
    const updated = await prisma.tenant.update({ where: { id: tenant.id }, data: { roomId: null } });
    res.json({ success: true, data: sanitize(updated) });
  } catch (err) {
    next(err);
  }
}

// Hard delete — only for correcting a genuine registration mistake
// (no payments or documents on record yet).
async function deleteTenant(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: { _count: { select: { payments: true, documents: true } } },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    if (tenant._count.payments > 0 || tenant._count.documents > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete a tenant with payment or document history. Offboard instead.",
      });
    }

    if (tenant.roomId) {
      await prisma.room.update({ where: { id: tenant.roomId }, data: { status: "VACANT" } });
    }
    if (tenant.photoUrl) await storage.removeFile(tenant.photoUrl);
    await prisma.tenant.delete({ where: { id: tenant.id } });
    res.json({ success: true, data: { message: "Tenant deleted." } });
  } catch (err) {
    next(err);
  }
}

// Staff-only: upload/replace the tenant's profile picture.
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "A photo file is required." });

    const tenant = await prisma.tenant.findFirst({ where: { id: req.params.tenantId, landlordId: req.landlordId } });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const photoUrl = await storage.saveBuffer(tenant.id, req.file.originalname, req.file.buffer, req.file.mimetype);
    if (tenant.photoUrl) await storage.removeFile(tenant.photoUrl);

    await prisma.tenant.update({ where: { id: tenant.id }, data: { photoUrl } });
    res.status(201).json({ success: true, data: { hasPhoto: true } });
  } catch (err) {
    next(err);
  }
}

// Staff-only: stream the tenant's profile picture inline.
async function getPhoto(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({ where: { id: req.params.tenantId, landlordId: req.landlordId } });
    if (!tenant || !tenant.photoUrl) return res.status(404).json({ success: false, error: "No photo on file." });

    const { buffer, contentType } = await storage.getFile(tenant.photoUrl);
    res.set("Content-Type", contentType || "image/jpeg");
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerTenant,
  listTenants,
  getTenant,
  updateTenant,
  offboardTenant,
  deleteTenant,
  uploadPhoto,
  getPhoto,
};
