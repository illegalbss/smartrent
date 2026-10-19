// Opens WhatsApp (app or web) with a prefilled message to this number.
// Nigerian local numbers ("0803…") are converted to international ("234803…"),
// which is the format wa.me requires.
export function whatsappUrl(phone, message) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function loginLinkMessage(name, link) {
  return `Hello ${name}, your RentaFlow tenant account is ready. Open this link to set your password: ${link}\n\nAfter that, log in with your phone number and the password you chose.`;
}
