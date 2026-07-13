const prisma = require("../config/prisma");

// Public — used by the (future) landlord signup plan-selection step, and by
// the staff-side "upgrade your plan" prompt when a room limit is hit.
async function listPlans(req, res, next) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { price: "asc" } });
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
}

// Super Admin only — lets pricing/limits change without a code deploy.
async function updatePlan(req, res, next) {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: req.params.planId } });
    if (!plan) return res.status(404).json({ success: false, error: "Plan not found." });

    const { name, roomLimit, price } = req.body;
    const updated = await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomLimit !== undefined && { roomLimit: roomLimit === null || roomLimit === "" ? null : Number(roomLimit) }),
        ...(price !== undefined && { price: Number(price) }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function createPlan(req, res, next) {
  try {
    const { name, roomLimit, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: "Name and price are required." });
    }
    const plan = await prisma.subscriptionPlan.create({
      data: { name, roomLimit: roomLimit === null || roomLimit === "" ? null : Number(roomLimit), price: Number(price) },
    });
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPlans, updatePlan, createPlan };
