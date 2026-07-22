const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

// Durable storage backed by Cloudinary. Every asset is uploaded with
// type: "authenticated" — Cloudinary will not serve it from a public URL at
// all. The only way to read one back is a freshly-signed URL generated here,
// fetched server-side inside getFile() — so a document is only ever reachable
// by going through this app's own auth-checked routes, never a direct link.
// (CLOUDINARY_URL env var auto-configures the SDK; no explicit config() call needed.)

const REF_PREFIX = "cld";

function packRef({ resourceType, publicId, format, contentType }) {
  return [REF_PREFIX, resourceType, publicId, format || "", encodeURIComponent(contentType || "")].join(":");
}

function unpackRef(fileUrl) {
  const parts = (fileUrl || "").split(":");
  if (parts.length < 5 || parts[0] !== REF_PREFIX) return null;
  const [, resourceType, publicId, format, encodedContentType] = parts;
  return { resourceType, publicId, format, contentType: decodeURIComponent(encodedContentType) };
}

// Uploads a buffer under `${scopeId}/${generatedName}` and returns a packed
// reference string — this is what gets stored as fileUrl/photoUrl in the database.
function saveBuffer(scopeId, originalName, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const unique = crypto.randomBytes(8).toString("hex");
    const publicId = `${scopeId}/${Date.now()}-${unique}`;

    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: "auto", type: "authenticated" },
      (error, result) => {
        if (error) return reject(new Error(`Storage upload failed: ${error.message}`));
        resolve(
          packRef({
            resourceType: result.resource_type,
            publicId: result.public_id,
            format: result.format,
            contentType: contentType || "application/octet-stream",
          })
        );
      }
    );
    stream.end(buffer);
  });
}

// Fetches file bytes + content-type so a controller can stream it back to the
// client — generates a fresh signed URL and downloads it server-side rather
// than ever handing the client a Cloudinary link directly.
async function getFile(fileUrl) {
  const ref = unpackRef(fileUrl);
  if (!ref) throw new Error("Storage download failed: unrecognized file reference.");

  const signedUrl = cloudinary.url(ref.publicId, {
    resource_type: ref.resourceType,
    type: "authenticated",
    format: ref.format || undefined,
    sign_url: true,
    secure: true,
  });

  const res = await fetch(signedUrl);
  if (!res.ok) throw new Error(`Storage download failed: Cloudinary returned ${res.status}.`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType: ref.contentType };
}

async function removeFile(fileUrl) {
  const ref = unpackRef(fileUrl);
  if (!ref) return;
  await cloudinary.uploader.destroy(ref.publicId, { resource_type: ref.resourceType, type: "authenticated", invalidate: true });
}

module.exports = { saveBuffer, getFile, removeFile };
