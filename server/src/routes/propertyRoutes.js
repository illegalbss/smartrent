const { Router } = require("express");
const multer = require("multer");
const { body } = require("express-validator");
const { requireAuth, requireStaff } = require("../middleware/auth");
const {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPhoto,
  getPhoto,
} = require("../controllers/propertyController");

const router = Router();
const staffRead = requireStaff();
const landlordOnly = requireAuth("landlord");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/properties", staffRead, listProperties);
router.get("/properties/:propertyId", staffRead, getProperty);

router.post(
  "/properties",
  landlordOnly,
  [
    body("name").trim().notEmpty().withMessage("Property name is required."),
    body("address").trim().notEmpty().withMessage("Address is required."),
    body("ownershipType").optional().isIn(["ORGANIZATION", "PERSONAL"]).withMessage("Invalid ownership type."),
  ],
  createProperty
);

router.put(
  "/properties/:propertyId",
  landlordOnly,
  [
    body("name").optional().trim().notEmpty().withMessage("Property name cannot be empty."),
    body("address").optional().trim().notEmpty().withMessage("Address cannot be empty."),
    body("ownershipType").optional().isIn(["ORGANIZATION", "PERSONAL"]).withMessage("Invalid ownership type."),
  ],
  updateProperty
);

router.delete("/properties/:propertyId", landlordOnly, deleteProperty);

router.post("/properties/:propertyId/photo", landlordOnly, upload.single("file"), uploadPhoto);
router.get("/properties/:propertyId/photo", staffRead, getPhoto);

module.exports = router;
