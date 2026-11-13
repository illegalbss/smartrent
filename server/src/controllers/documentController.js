const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const storage = require("../services/storage");

const MANUAL_UPLOAD_TYPES = ["REFEREE_FORM", "GOVERNMENT_ID", "PERSONAL_INFO_SHEET", "OTHER"];

// Secretary/Landlord uploading on the tenant's behalf.
async function uploadForTenant(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    if (!req.file) return res.status(400).json({ success: false, error: "A file is required." });

    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const fileUrl = await storage.saveBuffer(tenant.id, req.file.originalname, req.file.buffer, req.file.mimetype);
    const document = await prisma.document.create({
      data: {
        tenantId: tenant.id,
        type: req.body.type,
        fileName: req.file.originalname,
        fileUrl,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uploadedById: req.staffId,
        uploadedByRole: req.staffRole,
      },
    });
    res.status(201).json({ success: true, data: document });
  } catch (err) {
    next(err);
  }
}

// Staff-only: list a tenant's documents.
async function listForTenant(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const documents = await prisma.document.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: documents });
  } catch (err) {
    next(err);
  }
}

// Staff-only: every document across this landlord's tenants, newest first,
// for the Documents page. Metadata only — files still go through
// downloadDocument, which re-checks ownership.
async function listAll(req, res, next) {
  try {
    const documents = await prisma.document.findMany({
      where: { tenant: { landlordId: req.landlordId } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        uploadedByRole: true,
        createdAt: true,
        tenant: {
          select: { id: true, name: true, room: { select: { roomNumber: true, property: { select: { name: true } } } } },
        },
      },
    });
    res.json({ success: true, data: documents });
  } catch (err) {
    next(err);
  }
}

// Staff-only: download/view a stored document.
async function downloadDocument(req, res, next) {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenant: { landlordId: req.landlordId } },
    });
    if (!document) return res.status(404).json({ success: false, error: "Document not found." });

    const { buffer, contentType } = await storage.getFile(document.fileUrl);
    res.set("Content-Type", contentType || document.mimeType || "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename="${encodeURIComponent(document.fileName)}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

// Staff-only: delete a document (correcting an upload mistake).
async function deleteDocument(req, res, next) {
  try {
    const document = await prisma.document.findFirst({
      where: { id: req.params.documentId, tenant: { landlordId: req.landlordId } },
    });
    if (!document) return res.status(404).json({ success: false, error: "Document not found." });

    await storage.removeFile(document.fileUrl);
    await prisma.document.delete({ where: { id: document.id } });
    res.json({ success: true, data: { message: "Document deleted." } });
  } catch (err) {
    next(err);
  }
}

module.exports = { MANUAL_UPLOAD_TYPES, uploadForTenant, listForTenant, listAll, downloadDocument, deleteDocument };
