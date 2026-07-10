const { Router } = require("express");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const { listRooms, createRoom, updateRoom, deleteRoom } = require("../controllers/roomController");

const router = Router();
const staffRead = requireStaff();
const landlordOnly = requireAuth("landlord");

router.get("/properties/:propertyId/rooms", staffRead, listRooms);

router.post(
  "/properties/:propertyId/rooms",
  landlordOnly,
  [
    body("roomNumber").trim().notEmpty().withMessage("Room number is required."),
    body("rentAmount").isFloat({ gt: 0 }).withMessage("Rent amount must be a positive number."),
    body("status").optional().isIn(["VACANT", "OCCUPIED"]).withMessage("Invalid room status."),
  ],
  createRoom
);

router.put(
  "/rooms/:roomId",
  landlordOnly,
  [
    body("roomNumber").optional().trim().notEmpty().withMessage("Room number cannot be empty."),
    body("rentAmount").optional().isFloat({ gt: 0 }).withMessage("Rent amount must be a positive number."),
    body("status").optional().isIn(["VACANT", "OCCUPIED"]).withMessage("Invalid room status."),
  ],
  updateRoom
);

router.delete("/rooms/:roomId", landlordOnly, deleteRoom);

module.exports = router;
