// Tenants can log in with their phone number, which people type in many
// shapes: "0803 123 4567", "+2348031234567", "2348031234567", "8031234567".
// Everything is reduced to the local Nigerian form "08031234567" so those
// all match. Numbers that don't look Nigerian are kept as bare digits.
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234") && digits.length === 13) digits = `0${digits.slice(3)}`;
  else if (digits.length === 10 && /^[789]/.test(digits)) digits = `0${digits}`;
  return digits;
}

// A login identifier is treated as an email if it has an "@", otherwise as a phone.
function looksLikeEmail(identifier) {
  return String(identifier || "").includes("@");
}

module.exports = { normalizePhone, looksLikeEmail };
