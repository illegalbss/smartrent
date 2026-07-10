const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

// Tenant submits a complaint/message to their landlord.
async function createComplaint(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: req.auth.id } });
    const complaint = await prisma.complaint.create({
      data: {
        landlordId: tenant.landlordId,
        tenantId: tenant.id,
        message: req.body.message,
      },
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
}

// Tenant views their own complaint thread.
async function listOwnComplaints(req, res, next) {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { tenantId: req.auth.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
}

// Landlord/Secretary inbox of all complaints across their tenants.
async function listComplaintsForStaff(req, res, next) {
  try {
    const status = req.query.status;
    const complaints = await prisma.complaint.findMany({
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
    res.json({ success: true, data: complaints });
  } catch (err) {
    next(err);
  }
}

async function respondToComplaint(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const complaint = await prisma.complaint.findFirst({
      where: { id: req.params.complaintId, landlordId: req.landlordId },
    });
    if (!complaint) return res.status(404).json({ success: false, error: "Complaint not found." });

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        response: req.body.response,
        status: "RESOLVED",
        respondedAt: new Date(),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { createComplaint, listOwnComplaints, listComplaintsForStaff, respondToComplaint };
