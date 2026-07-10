const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Interim local-disk storage until the Supabase service role key is
// available. Swap this module for a Supabase Storage-backed implementation
// (upload/getSignedUrl/remove) without touching documentController.js.
//
// On Vercel the deployed bundle is read-only outside of /tmp, and /tmp itself
// is wiped between invocations — uploads here will NOT persist in production.
// This only prevents a hard crash (EROFS) until real object storage is wired up.
const UPLOAD_ROOT = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(__dirname, "..", "..", "uploads");

function saveBuffer(tenantId, originalName, buffer) {
  const dir = path.join(UPLOAD_ROOT, tenantId);
  fs.mkdirSync(dir, { recursive: true });

  const unique = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalName);
  const storedName = `${Date.now()}-${unique}${ext}`;
  fs.writeFileSync(path.join(dir, storedName), buffer);

  // fileUrl is stored relative to UPLOAD_ROOT so it stays portable.
  return path.join(tenantId, storedName);
}

function absolutePath(fileUrl) {
  return path.join(UPLOAD_ROOT, fileUrl);
}

function removeFile(fileUrl) {
  fs.rm(absolutePath(fileUrl), { force: true }, () => {});
}

module.exports = { UPLOAD_ROOT, saveBuffer, absolutePath, removeFile };
