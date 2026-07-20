// One-off setup script — seeds the fixed subscription plans and (optionally)
// a Super Admin account. Run with: node scripts/seed.js
//
// To also create a Super Admin, set SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD,
// and SUPERADMIN_NAME (optional) in the environment before running.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

// Flat annual license fees (10% off the equivalent 12-month rate, as an
// incentive to pay upfront) — not monthly, and not a per-transaction cut.
const PLANS = [
  { name: "Starter", roomLimit: 20, price: 86000 },
  { name: "Growth", roomLimit: 75, price: 195000 },
  { name: "Pro", roomLimit: null, price: 378000 },
];

async function seedPlans() {
  for (const plan of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: { roomLimit: plan.roomLimit, price: plan.price },
      create: plan,
    });
    console.log(`Plan ready: ${plan.name}`);
  }
}

async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.log("SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set — skipping Super Admin creation.");
    return;
  }
  const existing = await prisma.superAdmin.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.log(`Super Admin already exists: ${email}`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.superAdmin.create({
    data: { name: process.env.SUPERADMIN_NAME || "Super Admin", email: email.toLowerCase(), passwordHash },
  });
  console.log(`Super Admin created: ${email}`);
}

async function main() {
  await seedPlans();
  await seedSuperAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
