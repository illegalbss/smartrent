const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

// Landlord/Secretary posts a broadcast notice visible to every tenant in the portfolio.
async function createNotice(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const notice = await prisma.notice.create({
      data: {
        landlordId: req.landlordId,
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
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: notices });
  } catch (err) {
    next(err);
  }
}

// Tenant's own read-only feed of notices from their landlord.
async function listOwnNotices(req, res, next) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.auth.id } });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const notices = await prisma.notice.findMany({
      where: { landlordId: tenant.landlordId },
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
