const { validationResult } = require("express-validator");
const prisma = require("../config/prisma");
const storage = require("../services/storage");

function withPhotoFlag(property) {
  const { photoUrl, ...rest } = property;
  return { ...rest, hasPhoto: !!photoUrl };
}

async function listProperties(req, res, next) {
  try {
    const properties = await prisma.property.findMany({
      where: { landlordId: req.landlordId },
      include: { rooms: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = properties.map((p) => {
      const totalRooms = p.rooms.length;
      const occupiedRooms = p.rooms.filter((r) => r.status === "OCCUPIED").length;
      const { rooms, ...rest } = p;
      return withPhotoFlag({ ...rest, totalRooms, occupiedRooms });
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getProperty(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
      include: {
        rooms: {
          include: {
            tenants: {
              select: { id: true, name: true, email: true, phone: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { roomNumber: "asc" },
        },
      },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });
    res.json({ success: true, data: withPhotoFlag(property) });
  } catch (err) {
    next(err);
  }
}

async function createProperty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const { name, address, ownershipType } = req.body;
    const property = await prisma.property.create({
      data: { name, address, ownershipType: ownershipType || "PERSONAL", landlordId: req.auth.id },
    });
    res.status(201).json({ success: true, data: withPhotoFlag(property) });
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.auth.id },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const { name, address, ownershipType } = req.body;
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(ownershipType !== undefined && { ownershipType }),
      },
    });
    res.json({ success: true, data: withPhotoFlag(updated) });
  } catch (err) {
    next(err);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.auth.id },
      include: { rooms: true },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const hasOccupiedRoom = property.rooms.some((r) => r.status !== "VACANT");
    if (hasOccupiedRoom) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete a property with an occupied room. Offboard tenants first.",
      });
    }

    if (property.photoUrl) await storage.removeFile(property.photoUrl);
    await prisma.property.delete({ where: { id: property.id } });
    res.json({ success: true, data: { message: "Property deleted." } });
  } catch (err) {
    next(err);
  }
}

// Staff-only: upload/replace the property's photo.
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "A photo file is required." });

    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
    });
    if (!property) return res.status(404).json({ success: false, error: "Property not found." });

    const photoUrl = await storage.saveBuffer(`property-${property.id}`, req.file.originalname, req.file.buffer, req.file.mimetype);
    if (property.photoUrl) await storage.removeFile(property.photoUrl);

    await prisma.property.update({ where: { id: property.id }, data: { photoUrl } });
    res.status(201).json({ success: true, data: { hasPhoto: true } });
  } catch (err) {
    next(err);
  }
}

// Staff-only: stream the property's photo inline.
async function getPhoto(req, res, next) {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, landlordId: req.landlordId },
    });
    if (!property || !property.photoUrl) return res.status(404).json({ success: false, error: "No photo on file." });

    const { buffer, contentType } = await storage.getFile(property.photoUrl);
    res.set("Content-Type", contentType || "image/jpeg");
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPhoto,
  getPhoto,
};
