const { Router } = require("express");
const multer = require("multer");
const { body } = require("express-validator");
const { requireStaff } = require("../middleware/auth");
const {
  registerTenant,
  listTenants,
  getTenant,
  updateTenant,
  offboardTenant,
  deleteTenant,
  uploadPhoto,
  getPhoto,
} = require("../controllers/tenantController");

const router = Router();
const staff = requireStaff();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get("/tenants", staff, listTenants);
router.get("/tenants/:tenantId", staff, getTenant);

router.post(
  "/tenants",
  staff,
  [
    body("name").trim().notEmpty().withMessage("Tenant name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("roomId").optional().isString(),
    body("dateCommencement").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid commencement date."),
    body("dateExpiration").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid expiration date."),
    body("dateRenewal").optional({ checkFalsy: true }).isISO8601().withMessage("Invalid renewal date."),
  ],
  registerTenant
);

router.put(
  "/tenants/:tenantId",
  staff,
  [
    body("name").optional().trim().notEmpty().withMessage("Tenant name cannot be empty."),
    body("roomId").optional({ nullable: true }).isString(),
    body("dateCommencement").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid commencement date."),
    body("dateExpiration").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid expiration date."),
    body("dateRenewal").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Invalid renewal date."),
  ],
  updateTenant
);

router.post("/tenants/:tenantId/offboard", staff, offboardTenant);
router.delete("/tenants/:tenantId", staff, deleteTenant);

router.post("/tenants/:tenantId/photo", staff, upload.single("file"), uploadPhoto);
router.get("/tenants/:tenantId/photo", staff, getPhoto);

module.exports = router;
