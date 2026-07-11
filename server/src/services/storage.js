const crypto = require("crypto");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Durable storage backed by Supabase Storage — survives server restarts,
// redeploys, and works identically in local dev and on Vercel.
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "smartrent-uploads";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Uploads a buffer under `${scopeId}/${generatedName}` and returns that path —
// this is what gets stored as fileUrl/photoUrl in the database.
async function saveBuffer(scopeId, originalName, buffer, contentType) {
  const unique = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalName);
  const objectPath = `${scopeId}/${Date.now()}-${unique}${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: contentType || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return objectPath;
}

// Fetches file bytes + content-type so a controller can stream it back to the client.
async function getFile(fileUrl) {
  const { data, error } = await supabase.storage.from(BUCKET).download(fileUrl);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, contentType: data.type };
}

async function removeFile(fileUrl) {
  if (!fileUrl) return;
  await supabase.storage.from(BUCKET).remove([fileUrl]);
}

module.exports = { saveBuffer, getFile, removeFile };
