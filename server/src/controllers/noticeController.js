const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

// Landlord/Secretary posts a notice — targeted at everyone in the portfolio
// (no propertyId/tenantId), everyone at one property, or one specific tenant
// (e.g. a personal warning or notice to vacate).
async function createNotice(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { propertyId, tenantId, severity } = req.body;
    if (propertyId && tenantId) {
      return res.status(400).json({ success: false, error: "Target either a property or a tenant, not both." });
    }

    if (propertyId) {
      const property = await prisma.property.findFirst({ where: { id: propertyId, landlordId: req.landlordId } });
      if (!property) return res.status(404).json({ success: false, error: "Property not found." });
    }
    if (tenantId) {
      const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, landlordId: req.landlordId } });
      if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });
    }

    const notice = await prisma.notice.create({
      data: {
        landlordId: req.landlordId,
        propertyId: propertyId || null,
        tenantId: tenantId || null,
        severity: severity || "INFO",
        title: req.body.title,
        message: req.body.message,
        createdById: req.staffId,
        createdByRole: req.staffRole,
      },
    });
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    next(err);
  }
}

async function listForStaff(req, res, next) {
  try {
    const notices = await prisma.notice.findMany({
      where: { landlordId: req.landlordId },
      include: {
        property: { select: { name: true } },
        tenant: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: notices });
  } catch (err) {
    next(err);
  }
}

// Tenant's own read-only feed: portfolio-wide notices, notices targeted at
// their property, and notices addressed to them individually.
async function listOwnNotices(req, res, next) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.auth.id },
      select: { landlordId: true, room: { select: { propertyId: true } } },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const notices = await prisma.notice.findMany({
      where: {
        landlordId: tenant.landlordId,
        OR: [
          { propertyId: null, tenantId: null },
          ...(tenant.room ? [{ propertyId: tenant.room.propertyId }] : []),
          { tenantId: req.auth.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, data: notices });
  } catch (err) {
    next(err);
  }
}

async function deleteNotice(req, res, next) {
  try {
    const notice = await prisma.notice.findFirst({
      where: { id: req.params.noticeId, landlordId: req.landlordId },
    });
    if (!notice) return res.status(404).json({ success: false, error: "Notice not found." });

    await prisma.notice.delete({ where: { id: notice.id } });
    res.json({ success: true, data: { message: "Notice deleted." } });
  } catch (err) {
    next(err);
  }
}

module.exports = { createNotice, listForStaff, listOwnNotices, deleteNotice };
