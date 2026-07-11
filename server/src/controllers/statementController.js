const PDFKit = require("pdfkit");
const prisma = require("../config/prisma");

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function renderStatementBuffer(tenant, payments, landlordName) {
  return new Promise((resolve, reject) => {
    const doc = new PDFKit({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("PAYMENT STATEMENT", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666").text(`Generated ${formatDate(new Date())}`, { align: "center" });
    doc.fillColor("#000").moveDown(1.5);

    doc.fontSize(11);
    doc.text(`Tenant: ${tenant.name}`);
    doc.text(`Landlord: ${landlordName}`);
    if (tenant.room) {
      doc.text(`Property: ${tenant.room.property.name}`);
      doc.text(`Room: ${tenant.room.roomNumber}`);
    }
    doc.moveDown(1);

    const colX = { date: 50, coverage: 150, amount: 320, status: 400, source: 470 };
    const rowTop = doc.y;
    doc.fontSize(9).fillColor("#666");
    doc.text("DATE PAID", colX.date, rowTop);
    doc.text("COVERAGE", colX.coverage, rowTop);
    doc.text("AMOUNT", colX.amount, rowTop);
    doc.text("STATUS", colX.status, rowTop);
    doc.text("SOURCE", colX.source, rowTop);
    doc.moveTo(50, rowTop + 14).lineTo(545, rowTop + 14).strokeColor("#ccc").stroke();
    doc.fillColor("#000");

    let y = rowTop + 20;
    let total = 0;
    for (const p of payments) {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
      const coverage = p.coverageStart ? `${formatDate(p.coverageStart)} – ${formatDate(p.coverageEnd)}` : "—";
      doc.fontSize(9);
      doc.text(formatDate(p.datePaid), colX.date, y, { width: 95 });
      doc.text(coverage, colX.coverage, y, { width: 165 });
      doc.text(formatNaira(p.amount), colX.amount, y, { width: 75 });
      doc.text(p.status, colX.status, y, { width: 65 });
      doc.text(p.source === "PAYSTACK" ? "Paystack" : "Manual", colX.source, y, { width: 75 });
      if (p.status !== "OWING") total += Number(p.amount);
      y += 18;
    }

    doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor("#ccc").stroke();
    doc.fontSize(11).text(`Total Collected: ${formatNaira(total)}`, colX.amount, y + 14);

    doc.end();
  });
}

async function fetchTenantWithPayments(tenantId) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      room: { include: { property: { select: { name: true } } } },
      payments: { orderBy: { datePaid: "desc" } },
    },
  });
}

// Tenant downloads their own statement.
async function downloadOwnStatement(req, res, next) {
  try {
    const tenant = await fetchTenantWithPayments(req.auth.id);
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const landlord = await prisma.landlord.findUnique({ where: { id: tenant.landlordId }, select: { name: true } });
    const buffer = await renderStatementBuffer(tenant, tenant.payments, landlord?.name || "");

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="Payment Statement - ${tenant.name}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

// Staff downloads a statement for any tenant they manage.
async function downloadTenantStatement(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: {
        room: { include: { property: { select: { name: true } } } },
        payments: { orderBy: { datePaid: "desc" } },
      },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const landlord = await prisma.landlord.findUnique({ where: { id: req.landlordId }, select: { name: true } });
    const buffer = await renderStatementBuffer(tenant, tenant.payments, landlord?.name || "");

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="Payment Statement - ${tenant.name}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { downloadOwnStatement, downloadTenantStatement };
