const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

// Staff view: the general (portfolio-wide) rules plus any per-property overrides.
async function listForStaff(req, res, next) {
  try {
    const rules = await prisma.houseRules.findMany({
      where: { landlordId: req.landlordId },
      include: { property: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

// Creates or updates the rules document for a target (general if no propertyId).
async function upsertRules(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { propertyId, content } = req.body;
    if (propertyId) {
      const property = await prisma.property.findFirst({ where: { id: propertyId, landlordId: req.landlordId } });
      if (!property) return res.status(404).json({ success: false, error: "Property not found." });
    }

    const existing = await prisma.houseRules.findFirst({
      where: { landlordId: req.landlordId, propertyId: propertyId || null },
    });

    const rules = existing
      ? await prisma.houseRules.update({
          where: { id: existing.id },
          data: { content, updatedById: req.staffId, updatedByRole: req.staffRole },
        })
      : await prisma.houseRules.create({
          data: {
            landlordId: req.landlordId,
            propertyId: propertyId || null,
            content,
            updatedById: req.staffId,
            updatedByRole: req.staffRole,
          },
        });

    res.status(existing ? 200 : 201).json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

async function deleteRules(req, res, next) {
  try {
    const rules = await prisma.houseRules.findFirst({
      where: { id: req.params.rulesId, landlordId: req.landlordId },
    });
    if (!rules) return res.status(404).json({ success: false, error: "Rules not found." });

    await prisma.houseRules.delete({ where: { id: rules.id } });
    res.json({ success: true, data: { message: "Rules deleted." } });
  } catch (err) {
    next(err);
  }
}

// Tenant's effective rules: their property's specific rules if set, else the general ones.
async function getOwnRules(req, res, next) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.auth.id },
      select: { landlordId: true, room: { select: { propertyId: true } } },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    let rules = null;
    if (tenant.room) {
      rules = await prisma.houseRules.findFirst({ where: { landlordId: tenant.landlordId, propertyId: tenant.room.propertyId } });
    }
    if (!rules) {
      rules = await prisma.houseRules.findFirst({ where: { landlordId: tenant.landlordId, propertyId: null } });
    }

    res.json({ success: true, data: rules ? { content: rules.content, updatedAt: rules.updatedAt } : null });
  } catch (err) {
    next(err);
  }
}

module.exports = { listForStaff, upsertRules, deleteRules, getOwnRules };
