const PDFKit = require("pdfkit");
const prisma = require("../config/prisma");
const { computeTenantPaymentStatus } = require("../services/tenantPaymentStatus");
const { frequencyLabel } = require("../services/rentFrequency");

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

function renderReceiptBuffer(tenant, payment, landlordName) {
  return new Promise((resolve, reject) => {
    const doc = new PDFKit({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("PAYMENT RECEIPT", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666").text(`Receipt #${payment.id.slice(-8).toUpperCase()}`, { align: "center" });
    doc.fillColor("#000").moveDown(1.5);

    doc.fontSize(11);
    doc.text(`Tenant: ${tenant.name}`);
    doc.text(`Landlord: ${landlordName}`);
    if (tenant.room) {
      doc.text(`Property: ${tenant.room.property.name}`);
      doc.text(`Room: ${tenant.room.roomNumber}`);
    }
    doc.moveDown(1);

    doc.fontSize(14).text(`Amount Paid: ${formatNaira(payment.amount)}`);
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Date Paid: ${formatDate(payment.datePaid)}`);
    if (payment.coverageStart) doc.text(`Coverage Period: ${formatDate(payment.coverageStart)} – ${formatDate(payment.coverageEnd)}`);
    doc.text(`Payment Method: ${payment.source === "PAYSTACK" ? "Paystack (Online)" : "Manual"}`);
    doc.text(`Status: ${payment.status}`);
    if (payment.notes) doc.text(`Notes: ${payment.notes}`);

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666").text(`Generated ${formatDate(new Date())}`, { align: "center" });

    doc.end();
  });
}

// Staff downloads a receipt for one specific payment.
async function downloadReceipt(req, res, next) {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.paymentId, tenantId: req.params.tenantId, landlordId: req.landlordId },
    });
    if (!payment) return res.status(404).json({ success: false, error: "Payment not found." });

    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: { room: { include: { property: { select: { name: true } } } } },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });

    const landlord = await prisma.landlord.findUnique({ where: { id: req.landlordId }, select: { name: true } });
    const buffer = await renderReceiptBuffer(tenant, payment, landlord?.name || "");

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="Receipt - ${tenant.name} - ${formatDate(payment.datePaid)}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

function renderInvoiceBuffer(tenant, paymentStatus, landlordName) {
  return new Promise((resolve, reject) => {
    const doc = new PDFKit({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("RENT INVOICE", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666").text(`Issued ${formatDate(new Date())}`, { align: "center" });
    doc.fillColor("#000").moveDown(1.5);

    doc.fontSize(11);
    doc.text(`Billed To: ${tenant.name}`);
    doc.text(`Landlord: ${landlordName}`);
    doc.text(`Property: ${tenant.room.property.name}`);
    doc.text(`Room: ${tenant.room.roomNumber}`);
    doc.moveDown(1);

    doc.fontSize(14).text(`Amount Due: ${formatNaira(paymentStatus.outstanding)}`);
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Rent: ${formatNaira(tenant.room.rentAmount)} per ${frequencyLabel(tenant.room.rentFrequency)}`);
    doc.text(`Due Date: ${formatDate(paymentStatus.nextDueDate)}`);
    if (paymentStatus.isOverdue) {
      doc.fillColor("#c0392b").text(`Status: OVERDUE by ${Math.abs(paymentStatus.daysUntilDue)} day(s)`);
      doc.fillColor("#000");
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666").text("Please make payment at your earliest convenience.", { align: "center" });

    doc.end();
  });
}

// Staff downloads an invoice for the tenant's current outstanding balance.
async function downloadInvoice(req, res, next) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { id: req.params.tenantId, landlordId: req.landlordId },
      include: {
        room: { include: { property: { select: { name: true } } } },
        payments: { orderBy: { datePaid: "desc" }, take: 1 },
      },
    });
    if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found." });
    if (!tenant.room) return res.status(409).json({ success: false, error: "Tenant is not assigned to a room." });

    const paymentStatus = computeTenantPaymentStatus({
      room: tenant.room,
      latestPayment: tenant.payments[0] || null,
      fallbackDueDate: tenant.dateCommencement,
    });
    const landlord = await prisma.landlord.findUnique({ where: { id: req.landlordId }, select: { name: true } });
    const buffer = await renderInvoiceBuffer(tenant, paymentStatus, landlord?.name || "");

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="Invoice - ${tenant.name}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { downloadOwnStatement, downloadTenantStatement, downloadReceipt, downloadInvoice };
