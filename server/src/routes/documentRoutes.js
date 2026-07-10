const { Router } = require("express");
const multer = require("multer");
const { body } = require("express-validator");
const { requireStaff } = require("../middleware/auth");
const {
  MANUAL_UPLOAD_TYPES,
  uploadForTenant,
  listForTenant,
  downloadDocument,
  deleteDocument,
} = require("../controllers/documentController");
const { generateAgreement } = require("../controllers/tenancyAgreementController");

const router = Router();
const staff = requireStaff();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/tenants/:tenantId/documents", staff, listForTenant);
router.post(
  "/tenants/:tenantId/documents",
  staff,
  upload.single("file"),
  [body("type").isIn(MANUAL_UPLOAD_TYPES).withMessage("Invalid document type.")],
  uploadForTenant
);
router.get("/documents/:documentId/download", staff, downloadDocument);
router.delete("/documents/:documentId", staff, deleteDocument);

router.post("/tenants/:tenantId/documents/tenancy-agreement/generate", staff, generateAgreement);

module.exports = router;
