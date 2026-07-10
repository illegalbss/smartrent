const PDFKit = require("pdfkit");
const prisma = require("../config/prisma");
const storage = require("../services/storage");

function formatDate(date) {
  if (!date) return "________________";
  return new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

function formatNaira(amount) {
  if (amount === null || amount === undefined) return "₦________________";
  return `₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function renderPdfBuffer(tenant) {
  return new Promise((resolve, reject) => {
    const doc = new PDFKit({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const property = tenant.room.property;

    doc.fontSize(18).text("TENANCY AGREEMENT", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(11).text(
      `This Tenancy Agreement is made this ${formatDate(new Date())} between ${property.name} ` +
        `(the "Landlord") and ${tenant.name} (the "Tenant"), for the letting of the premises described below.`
    );
    doc.moveDown();

    doc.fontSize(13).text("1. Premises", { underline: true });
    doc.fontSize(11).text(`Property: ${property.name}`);
    doc.text(`Address: ${property.address}`);
    doc.text(`Room/Apartment Number: ${tenant.room.roomNumber}`);
    doc.moveDown();

    doc.fontSize(13).text("2. Tenant Details", { underline: true });
    doc.fontSize(11).text(`Name: ${tenant.name}`);
    doc.text(`Phone Number: ${tenant.phone || "—"}`);
    doc.text(`Email: ${tenant.email}`);
    doc.moveDown();

    doc.fontSize(13).text("3. Term of Tenancy", { underline: true });
    doc.fontSize(11).text(`Date of Commencement: ${formatDate(tenant.dateCommencement)}`);
    doc.text(`Date of Expiration: ${formatDate(tenant.dateExpiration)}`);
    doc.text(`Renewal Date: ${formatDate(tenant.dateRenewal)}`);
    doc.moveDown();

    doc.fontSize(13).text("4. Rent", { underline: true });
    doc.fontSize(11).text(`Rent Amount: ${formatNaira(tenant.room.rentAmount)} per annum`);
    doc.moveDown(2);

    doc.fontSize(11).text("Landlord Signature: ______________________          Date: ______________");
    doc.moveDown();
    doc.text("Tenant Signature: ______________________          Date: ______________");

    doc.end();
  });
}

// Auto-fills from tenant/room/property data. Regenerating replaces the
// previously stored copy so there is only ever one current agreement on file.
async function generateAgreement(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: { room: { include: { property: true } } },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });
    if (!tenant.room) {
      return res.status(409).json({ success: false, error: "Tenant must be assigned to a room before generating an agreement." });
    }

    const buffer = await renderPdfBuffer(tenant);
    const fileUrl = storage.saveBuffer(tenant.id, `tenancy-agreement-${tenant.id}.pdf`, buffer);

    const existing = await prisma.document.findFirst({
      where: { tenantId: tenant.id, type: "TENANCY_AGREEMENT" },
    });
    if (existing) {
      storage.removeFile(existing.fileUrl);
      await prisma.document.delete({ where: { id: existing.id } });
    }

    const document = await prisma.document.create({
      data: {
        tenantId: tenant.id,
        type: "TENANCY_AGREEMENT",
        fileName: `Tenancy Agreement - ${tenant.name}.pdf`,
        fileUrl,
        mimeType: "application/pdf",
        sizeBytes: buffer.length,
        uploadedById: req.staffId,
        uploadedByRole: req.staffRole,
      },
    });

    res.status(201).json({ success: true, data: document });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateAgreement };
