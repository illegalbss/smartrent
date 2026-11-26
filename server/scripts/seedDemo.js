// Creates (or resets) a DEMO landlord account full of made-up sample data,
// for showing RentaFlow to prospective landlords. It is a completely
// separate account: it never touches any real landlord's data.
//
// Run:   node scripts/seedDemo.js
// Optional: DEMO_PASSWORD=... to choose the password (otherwise one is
// generated and printed). Running it again wipes the demo and starts fresh.
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

// example.com is reserved for examples, so nobody can ever own this inbox.
const DEMO_EMAIL = "demo@example.com";
const DEMO_SECRETARY_EMAIL = "demo.secretary@example.com";

const DAY = 86400000;
const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * DAY);
const addMonths = (d, m) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
};
const FREQ_MONTHS = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 };

// plan: how this tenant's payments look today
//  paid     – fully paid, covered well into the future
//  dueSoon  – paid, but the next payment falls due within a week
//  partial  – paid part of the current period
//  overdue  – their covered period ended and nothing new was paid
const FLATS = [
  { room: "Flat 1A", rent: 850000, name: "Chinedu Eze", phone: "08031234501", plan: "overdue", since: 26 },
  { room: "Flat 1B", rent: 850000, name: "Amaka Obi", phone: "08031234502", plan: "partial", since: 20 },
  { room: "Flat 2A", rent: 900000, name: "Emeka Nwosu", phone: "08031234503", plan: "paid", since: 14 },
  { room: "Flat 2B", rent: 900000, name: "Ifeoma Okeke", phone: "08031234504", plan: "paid", since: 9 },
  { room: "Flat 3A", rent: 750000, name: "Tunde Bakare", phone: "08031234505", plan: "dueSoon", since: 23 },
  { room: "Flat 3B", rent: 750000, name: "Ngozi Umeh", phone: "08031234506", plan: "paid", since: 5 },
  { room: "Flat 4A", rent: 650000, name: "Yusuf Abdullahi", phone: "08031234507", plan: "paid", since: 2 },
  { room: "Flat 4B", rent: 650000, vacant: true },
];
const SHOPS = [
  { room: "Shop 1", rent: 45000, freq: "MONTHLY", name: "Ngozi Stores", owner: "Ngozi Anyanwu", phone: "08031234511", plan: "paid", since: 11 },
  { room: "Shop 2", rent: 45000, freq: "MONTHLY", name: "Kelechi Phones", owner: "Kelechi Duru", phone: "08031234512", plan: "overdue", since: 8 },
  { room: "Shop 3", rent: 150000, freq: "QUARTERLY", name: "Mama Tee Foods", owner: "Titilayo Ade", phone: "08031234513", plan: "paid", since: 13 },
  { room: "Shop 4", rent: 150000, freq: "QUARTERLY", name: "Uche Fabrics", owner: "Uchenna Igwe", phone: "08031234514", plan: "partial", since: 7 },
  { room: "Shop 5", rent: 500000, freq: "YEARLY", name: "Bright Pharmacy", owner: "Chioma Nnaji", phone: "08031234515", plan: "paid", since: 10 },
  { room: "Shop 6", rent: 45000, freq: "MONTHLY", vacant: true },
];
const METHODS = ["Bank transfer", "Cash", "POS", "Bank transfer", "Bank transfer"];

function password() {
  const words = ["Rent", "Flow", "Gold", "Court", "Plaza", "Demo"];
  const pick = () => words[crypto.randomInt(words.length)];
  return `${pick()}${pick()}-${crypto.randomInt(1000, 9999)}`;
}

// Builds one tenant's payment history: periods back-to-back from when they
// moved in, shaped by their plan.
function paymentsFor({ rent, freq = "YEARLY", plan, since }) {
  const months = FREQ_MONTHS[freq];
  let start = addMonths(now, -since);
  const out = [];
  for (;;) {
    const end = addMonths(start, months);
    const isCurrent = end > now;
    if (isCurrent) {
      if (plan === "partial") out.push({ start, end, amount: Math.round(rent * 0.6), status: "PARTIAL" });
      else out.push({ start, end, amount: rent, status: "PAID" });
      break;
    }
    out.push({ start, end, amount: rent, status: "PAID" });
    start = end;
  }
  // overdue: drop the latest periods until their cover ended 3+ weeks ago
  if (plan === "overdue") {
    while (out.length > 1 && out[out.length - 1].end > new Date(now.getTime() - 21 * DAY)) out.pop();
  }
    if (plan === "dueSoon" && out.length) {
    const last = out[out.length - 1];
    last.end = new Date(now.getTime() + 5 * DAY);
  }
  return out;
}

async function main() {
  const pw = process.env.DEMO_PASSWORD || password();

  const existing = await prisma.landlord.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    // Everything of the demo account cascades away with it.
    await prisma.landlord.delete({ where: { id: existing.id } });
    console.log("Old demo data removed.");
  }

  const landlord = await prisma.landlord.create({
    data: {
      name: "Demo Landlord (sample data)",
      email: DEMO_EMAIL,
      phone: "08030000000",
      passwordHash: await bcrypt.hash(pw, 10),
    },
  });
  const secretary = await prisma.secretary.create({
    data: { landlordId: landlord.id, name: "Chidi Okafor (demo secretary)", email: DEMO_SECRETARY_EMAIL, phone: "08030000001" },
  });

  const flats = await prisma.property.create({
    data: { landlordId: landlord.id, name: "Sunrise Court", address: "12 Zik Avenue, Independence Layout, Enugu", propertyType: "RESIDENTIAL" },
  });
  const plaza = await prisma.property.create({
    data: { landlordId: landlord.id, name: "Ogbete Plaza", address: "Ogbete Main Market, Enugu", propertyType: "COMMERCIAL", ownershipType: "ORGANIZATION" },
  });

  let methodIndex = 0;
  const tenants = [];
  async function addUnit(property, u, isShop) {
    const room = await prisma.room.create({
      data: {
        propertyId: property.id,
        roomNumber: u.room,
        rentAmount: u.rent,
        rentFrequency: u.freq || "YEARLY",
        status: u.vacant ? "VACANT" : "OCCUPIED",
      },
    });
    if (u.vacant) return;
    const tenant = await prisma.tenant.create({
      data: {
        landlordId: landlord.id,
        roomId: room.id,
        occupantType: isShop ? "SHOP_OWNER" : "RESIDENTIAL_TENANT",
        name: isShop ? u.owner : u.name,
        businessName: isShop ? u.name : null,
        phone: u.phone,
        dateCommencement: addMonths(now, -u.since),
        securityDeposit: isShop ? null : Math.round(u.rent * 0.1),
        nextOfKinName: "Sample Next-of-kin",
        nextOfKinPhone: "08039999999",
        registeredById: landlord.id,
        registeredByRole: "LANDLORD",
        createdAt: addMonths(now, -u.since),
      },
    });
    tenants.push(tenant);
    for (const p of paymentsFor(u)) {
      const datePaid = new Date(Math.min(p.start.getTime() + 2 * DAY, now.getTime() - DAY));
      const bySecretary = methodIndex % 3 === 1;
      const payment = await prisma.payment.create({
        data: {
          landlordId: landlord.id,
          tenantId: tenant.id,
          roomId: room.id,
          amount: p.amount,
          datePaid,
          coverageStart: p.start,
          coverageEnd: p.end,
          status: p.status,
          notes: METHODS[methodIndex++ % METHODS.length],
          createdById: bySecretary ? secretary.id : landlord.id,
          createdByRole: bySecretary ? "SECRETARY" : "LANDLORD",
          createdAt: datePaid,
        },
      });
      await prisma.paymentAuditLog.create({
        data: {
          paymentId: payment.id,
          landlordId: landlord.id,
          action: "CREATED",
          performedById: payment.createdById,
          performedByRole: payment.createdByRole,
          performedByName: bySecretary ? secretary.name : landlord.name,
          newData: { ...payment, amount: Number(payment.amount) },
          createdAt: datePaid,
        },
      });
    }
  }
  for (const u of FLATS) await addUnit(flats, u, false);
  for (const u of SHOPS) await addUnit(plaza, u, true);

  const byName = (n) => tenants.find((t) => t.name === n);
  await prisma.complaint.createMany({
    data: [
      { landlordId: landlord.id, tenantId: byName("Amaka Obi").id, message: "The kitchen tap has been leaking since Monday.", category: "Plumbing", priority: "MEDIUM", createdAt: daysAgo(2) },
      { landlordId: landlord.id, tenantId: byName("Emeka Nwosu").id, message: "Generator noise from the next compound at night.", category: "Noise", priority: "LOW", createdAt: daysAgo(6) },
      {
        landlordId: landlord.id,
        tenantId: byName("Ngozi Umeh").id,
        message: "Security light at the gate is not working.",
        category: "Electrical",
        status: "RESOLVED",
        response: "Electrician replaced the bulb on Saturday.",
        respondedAt: daysAgo(10),
        createdAt: daysAgo(12),
      },
    ],
  });
  await prisma.maintenanceRequest.createMany({
    data: [
      { landlordId: landlord.id, tenantId: byName("Tunde Bakare").id, title: "Bathroom door lock", description: "The lock is stiff and sometimes jams.", createdAt: daysAgo(3) },
      { landlordId: landlord.id, tenantId: byName("Chioma Nnaji").id, title: "Shop shutter", description: "Shutter rail needs greasing.", status: "IN_PROGRESS", createdAt: daysAgo(5) },
    ],
  });
  await prisma.notice.createMany({
    data: [
      {
        landlordId: landlord.id,
        propertyId: flats.id,
        title: "Water tank cleaning on Saturday",
        message: "Water will be off from 9am to 1pm this Saturday while the tank is cleaned.",
        createdById: landlord.id,
        createdByRole: "LANDLORD",
        createdAt: daysAgo(4),
      },
      {
        landlordId: landlord.id,
        title: "New payment receipts",
        message: "Receipts are now sent through RentaFlow. Ask us if you have not received yours.",
        createdById: landlord.id,
        createdByRole: "LANDLORD",
        createdAt: daysAgo(15),
      },
    ],
  });

  // A few things the demo secretary "did", so the History log shows off.
  const sa = (minsAgo, action, category, summary) => ({
    landlordId: landlord.id,
    actorId: secretary.id,
    actorRole: "SECRETARY",
    actorName: secretary.name,
    action,
    category,
    summary,
    createdAt: new Date(now.getTime() - minsAgo * 60000),
  });
  await prisma.staffActivity.createMany({
    data: [
      sa(35, "DOCUMENT_VIEWED", "documents", "Opened tenancy-agreement.pdf (tenancy agreement) of Emeka Nwosu"),
      sa(90, "TENANT_UPDATED", "tenants", "Edited tenant Amaka Obi: changed phone"),
      sa(60 * 26, "PRINTED", "downloads", "Printed a tenant account statement: Tunde Bakare"),
      sa(60 * 50, "COMPLAINT_REPLIED", "messages", "Replied to Ngozi Umeh's message"),
    ],
  });

  const count = await prisma.payment.count({ where: { landlordId: landlord.id } });
  console.log("\nDemo account ready (sample data only).");
  console.log("  Properties: 2   Units: 14   Tenants:", tenants.length, "  Payments:", count);
  console.log("\n  Log in as Landlord");
  console.log("  Email:    ", DEMO_EMAIL);
  console.log("  Password: ", pw);
  console.log("\nRun this script again any time to reset the demo.\n");
}

main()
  .catch((err) => {
    console.error("Demo setup failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
