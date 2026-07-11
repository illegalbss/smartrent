const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

// Tenant submits a repair/maintenance request against their own tenancy.
async function createRequest(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: req.auth.id } });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const request = await prisma.maintenanceRequest.create({
      data: {
        landlordId: tenant.landlordId,
        tenantId: tenant.id,
        title: req.body.title,
        description: req.body.description,
      },
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

// Tenant views their own maintenance request history.
async function listOwnRequests(req, res, next) {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: req.auth.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

// Landlord/Secretary view of every maintenance request across the portfolio.
async function listForStaff(req, res, next) {
  try {
    const status = req.query.status;
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        landlordId: req.landlordId,
        ...(status && { status }),
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
            room: { select: { roomNumber: true, property: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const request = await prisma.maintenanceRequest.findFirst({
      where: { id: req.params.requestId, landlordId: req.landlordId },
    });
    if (!request) return res.status(404).json({ success: false, error: "Maintenance request not found." });

    const { status } = req.body;
    const updated = await prisma.maintenanceRequest.update({
      where: { id: request.id },
      data: {
        status,
        resolvedAt: status === "COMPLETED" ? new Date() : null,
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRequest, listOwnRequests, listForStaff, updateStatus };
