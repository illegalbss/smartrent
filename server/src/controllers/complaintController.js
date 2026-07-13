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

// Landlord/Secretary inbox of all complaints across their tenants — optionally
// narrowed to one tenant (used by the tenant profile's Complaints tab).
async function listComplaintsForStaff(req, res, next) {
  try {
    const status = req.query.status;
    const tenantId = req.query.tenantId;
    const complaints = await prisma.complaint.findMany({
      where: {
        landlordId: req.landlordId,
        ...(status && { status }),
        ...(tenantId && { tenantId }),
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

// Staff logs a complaint on a tenant's behalf (e.g. reported by phone).
async function createComplaintForTenant(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const { message, priority, category } = req.body;
    const complaint = await prisma.complaint.create({
      data: {
        landlordId: req.landlordId,
        tenantId: tenant.id,
        message,
        priority: priority || "MEDIUM",
        category: category || null,
      },
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
}

// Staff sets priority/category/assignment — independent of resolving the complaint.
async function updateComplaintTriage(req, res, next) {
  try {
    const complaint = await prisma.complaint.findFirst({
      where: { id: req.params.complaintId, landlordId: req.landlordId },
    });
    if (!complaint) return res.status(404).json({ success: false, error: "Complaint not found." });

    const { priority, category, assignedToId, assignedToRole, assignedToName } = req.body;
    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category: category || null }),
        ...(assignedToId !== undefined && {
          assignedToId: assignedToId || null,
          assignedToRole: assignedToId ? assignedToRole : null,
          assignedToName: assignedToId ? assignedToName : null,
        }),
      },
    });
    res.json({ success: true, data: updated });
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

module.exports = {
  createComplaint,
  listOwnComplaints,
  listComplaintsForStaff,
  createComplaintForTenant,
  updateComplaintTriage,
  respondToComplaint,
};
