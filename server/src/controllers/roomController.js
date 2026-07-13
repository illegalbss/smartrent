const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");

async function listRooms(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const rooms = await prisma.room.findMany({
      where: { propertyId: property.id },
      include: {
        tenants: {
          select: { id: true, name: true, email: true, phone: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { roomNumber: "asc" },
    });
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
}

async function createRoom(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.auth.id },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const landlord = await prisma.landlord.findUnique({ where: { id: req.auth.id }, include: { plan: true } });
    if (landlord.plan && landlord.plan.roomLimit !== null) {
      const currentRoomCount = await prisma.room.count({ where: { property: { landlordId: req.auth.id } } });
      if (currentRoomCount >= landlord.plan.roomLimit) {
        return res.status(403).json({
          success: false,
          error: `Your ${landlord.plan.name} plan allows up to ${landlord.plan.roomLimit} rooms. Upgrade your plan to add more.`,
          code: "ROOM_LIMIT_REACHED",
        });
      }
    }

    const { roomNumber, rentAmount, status } = req.body;
    const existing = await prisma.room.findFirst({ where: { propertyId: property.id, roomNumber } });
    if (existing) {
      return res.status(409).json({ success: false, error: "A room with this number already exists on this property." });
    }

    const room = await prisma.room.create({
      data: { propertyId: property.id, roomNumber, rentAmount, status: status || "VACANT" },
    });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

async function updateRoom(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const room = await prisma.room.findFirst({
      where: { id: req.params.roomId, property: { landlordId: req.auth.id } },
    });
    if (!room) return res.status(404).json({ success: false, error: "Room not found." });

    const { roomNumber, rentAmount, status } = req.body;
    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        ...(roomNumber !== undefined && { roomNumber }),
        ...(rentAmount !== undefined && { rentAmount }),
        ...(status !== undefined && { status }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const room = await prisma.room.findFirst({
      where: { id: req.params.roomId, property: { landlordId: req.auth.id } },
    });
    if (!room) return res.status(404).json({ success: false, error: "Room not found." });
    if (room.status !== "VACANT") {
      return res.status(409).json({ success: false, error: "Cannot delete an occupied room. Offboard the tenant first." });
    }
    await prisma.room.delete({ where: { id: room.id } });
    res.json({ success: true, data: { message: "Room deleted." } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRooms, createRoom, updateRoom, deleteRoom };
