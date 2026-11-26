// Who landlords and secretaries contact for help with RentaFlow itself.
// Fill these in; the "Need help?" box only shows what's set here.
// WhatsApp: international format without "+" or spaces, e.g. "2348012345678".
export const SUPPORT = {
  whatsapp: "",
  phone: "",
  email: "",
  hours: "Mon–Sat, 9am–6pm",
};

export const hasSupportContact = Boolean(SUPPORT.whatsapp || SUPPORT.phone || SUPPORT.email);
