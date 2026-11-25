const prisma = require("../config/prisma");

// Records every change a landlord or secretary makes — plus sensitive reads
// like opening a private document — into StaffActivity, so the landlord can
// see exactly who did what. Payment create/edit/delete are already recorded
// (with before/after copies) in PaymentAuditLog, so they're not repeated here.
//
// How it works: each rule matches a method + path. `before` runs ahead of the
// route (so a deleted thing's name can still be shown), `summary` builds the
// sentence once the route has succeeded. Logging never blocks or fails the
// request itself.

const naira = (v) => `₦${Number(v || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
const FREQ = { MONTHLY: "month", QUARTERLY: "quarter", YEARLY: "year" };
const DOC_TYPE = {
  REFEREE_FORM: "referee form",
  GOVERNMENT_ID: "ID",
  PERSONAL_INFO_SHEET: "personal information sheet",
  TENANCY_AGREEMENT: "tenancy agreement",
  UTILITY_BILL: "utility bill",
  INSPECTION_REPORT: "inspection report",
  OTHER: "document",
};

// --- lookups used by `before` ----------------------------------------------
const tenantInfo = (id) =>
  prisma.tenant.findUnique({
    where: { id },
    include: { room: { select: { roomNumber: true, property: { select: { name: true } } } } },
  });
const roomLabel = (t) => (t?.room ? `${t.room.property.name} ${t.room.roomNumber}` : "no room");

const TENANT_FIELDS = {
  name: "name",
  phone: "phone",
  email: "email",
  roomId: "room",
  dateCommencement: "start date",
  dateExpiration: "lease end date",
  dateRenewal: "renewal date",
  securityDeposit: "security deposit",
  businessName: "business name",
  cacNumber: "CAC number",
  nextOfKinName: "next of kin",
  nextOfKinPhone: "next of kin phone",
};
const norm = (v) => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s.slice(0, 10) : s;
};
function changedFields(before, body, labels) {
  return Object.keys(labels).filter((k) => body[k] !== undefined && norm(body[k]) !== norm(before?.[k])).map((k) => labels[k]);
}

const R = (method, pattern, def) => ({ method, regex: new RegExp(pattern), ...def });

const RULES = [
  // Tenants
  R("POST", "^/tenants$", {
    action: "TENANT_REGISTERED",
    category: "tenants",
    summary: ({ res }) => `Registered tenant ${res?.name}${res?.phone ? ` (${res.phone})` : ""}`,
    entity: ({ res }) => res?.id,
  }),
  R("POST", "^/tenants/login-links$", {
    action: "LOGIN_LINKS_GENERATED",
    category: "tenants",
    summary: ({ res }) => `Prepared login links for ${Array.isArray(res) ? res.length : "several"} tenant(s) who haven't logged in yet`,
  }),
  R("PUT", "^/tenants/(?<tenantId>[^/]+)$", {
    action: "TENANT_UPDATED",
    category: "tenants",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre, body }) => {
      const fields = changedFields(pre, body, TENANT_FIELDS);
      return `Edited tenant ${pre?.name}${fields.length ? `: changed ${fields.join(", ")}` : " (no visible changes)"}`;
    },
    details: ({ pre, body }) =>
      Object.fromEntries(
        Object.keys(TENANT_FIELDS)
          .filter((k) => body[k] !== undefined && norm(body[k]) !== norm(pre?.[k]))
          .map((k) => [TENANT_FIELDS[k], { from: norm(pre?.[k]) || null, to: norm(body[k]) || null }])
      ),
    entity: ({ p }) => p.tenantId,
  }),
  R("POST", "^/tenants/(?<tenantId>[^/]+)/offboard$", {
    action: "TENANCY_ENDED",
    category: "tenants",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Ended the tenancy of ${pre?.name} (${roomLabel(pre)}) — the room is now vacant`,
    entity: ({ p }) => p.tenantId,
  }),
  R("DELETE", "^/tenants/(?<tenantId>[^/]+)$", {
    action: "TENANT_DELETED",
    category: "tenants",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Deleted tenant ${pre?.name} (${roomLabel(pre)})`,
    entity: ({ p }) => p.tenantId,
  }),
  R("POST", "^/tenants/(?<tenantId>[^/]+)/login-link$", {
    action: "LOGIN_LINK_CREATED",
    category: "tenants",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Created a new login link for ${pre?.name} (the link lets them set a new password)`,
    entity: ({ p }) => p.tenantId,
  }),
  R("POST", "^/tenants/(?<tenantId>[^/]+)/photo$", {
    action: "TENANT_PHOTO_CHANGED",
    category: "tenants",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Changed the photo of ${pre?.name}`,
    entity: ({ p }) => p.tenantId,
  }),

  // Documents (including opening one)
  R("POST", "^/tenants/(?<tenantId>[^/]+)/documents$", {
    action: "DOCUMENT_UPLOADED",
    category: "documents",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre, res }) => `Uploaded ${res?.fileName} (${DOC_TYPE[res?.type] || "document"}) for ${pre?.name}`,
    entity: ({ res }) => res?.id,
  }),
  R("POST", "^/tenants/(?<tenantId>[^/]+)/documents/tenancy-agreement/generate$", {
    action: "AGREEMENT_GENERATED",
    category: "documents",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Generated a tenancy agreement for ${pre?.name}`,
    entity: ({ p }) => p.tenantId,
  }),
  R("GET", "^/documents/(?<documentId>[^/]+)/download$", {
    action: "DOCUMENT_VIEWED",
    category: "documents",
    before: ({ p }) => prisma.document.findUnique({ where: { id: p.documentId }, include: { tenant: { select: { name: true } } } }),
    summary: ({ pre }) => `Opened ${pre?.fileName} (${DOC_TYPE[pre?.type] || "document"}) of ${pre?.tenant?.name}`,
    entity: ({ p }) => p.documentId,
  }),
  R("DELETE", "^/documents/(?<documentId>[^/]+)$", {
    action: "DOCUMENT_DELETED",
    category: "documents",
    before: ({ p }) => prisma.document.findUnique({ where: { id: p.documentId }, include: { tenant: { select: { name: true } } } }),
    summary: ({ pre }) => `Deleted ${pre?.fileName} (${DOC_TYPE[pre?.type] || "document"}) of ${pre?.tenant?.name}`,
    entity: ({ p }) => p.documentId,
  }),

  // Downloads of payment records
  R("GET", "^/tenants/(?<tenantId>[^/]+)/payments/statement$", {
    action: "STATEMENT_DOWNLOADED",
    category: "downloads",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Downloaded the account statement of ${pre?.name}`,
    entity: ({ p }) => p.tenantId,
  }),
  R("GET", "^/tenants/(?<tenantId>[^/]+)/payments/(?<paymentId>[^/]+)/receipt$", {
    action: "RECEIPT_DOWNLOADED",
    category: "downloads",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre, p }) => `Downloaded receipt #${p.paymentId.slice(-8).toUpperCase()} for ${pre?.name}`,
    entity: ({ p }) => p.paymentId,
  }),
  R("GET", "^/tenants/(?<tenantId>[^/]+)/invoice$", {
    action: "INVOICE_DOWNLOADED",
    category: "downloads",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Downloaded an invoice for ${pre?.name}`,
    entity: ({ p }) => p.tenantId,
  }),

  // Properties and rooms
  R("POST", "^/properties$", {
    action: "PROPERTY_ADDED",
    category: "properties",
    summary: ({ res }) => `Added property ${res?.name} (${res?.address})`,
    entity: ({ res }) => res?.id,
  }),
  R("PUT", "^/properties/(?<propertyId>[^/]+)$", {
    action: "PROPERTY_UPDATED",
    category: "properties",
    before: ({ p }) => prisma.property.findUnique({ where: { id: p.propertyId } }),
    summary: ({ pre, body }) => {
      const fields = changedFields(pre, body, { name: "name", address: "address", ownershipType: "ownership type" });
      return `Edited property ${pre?.name}${fields.length ? `: changed ${fields.join(", ")}` : ""}`;
    },
    entity: ({ p }) => p.propertyId,
  }),
  R("DELETE", "^/properties/(?<propertyId>[^/]+)$", {
    action: "PROPERTY_DELETED",
    category: "properties",
    before: ({ p }) => prisma.property.findUnique({ where: { id: p.propertyId } }),
    summary: ({ pre }) => `Deleted property ${pre?.name}`,
    entity: ({ p }) => p.propertyId,
  }),
  R("POST", "^/properties/(?<propertyId>[^/]+)/photo$", {
    action: "PROPERTY_PHOTO_CHANGED",
    category: "properties",
    before: ({ p }) => prisma.property.findUnique({ where: { id: p.propertyId } }),
    summary: ({ pre }) => `Changed the photo of property ${pre?.name}`,
    entity: ({ p }) => p.propertyId,
  }),
  R("POST", "^/properties/(?<propertyId>[^/]+)/rooms$", {
    action: "ROOM_ADDED",
    category: "properties",
    before: ({ p }) => prisma.property.findUnique({ where: { id: p.propertyId } }),
    summary: ({ pre, res }) => `Added room ${res?.roomNumber} to ${pre?.name} (rent ${naira(res?.rentAmount)} per ${FREQ[res?.rentFrequency] || "year"})`,
    entity: ({ res }) => res?.id,
  }),
  R("PUT", "^/rooms/(?<roomId>[^/]+)$", {
    action: "ROOM_UPDATED",
    category: "properties",
    before: ({ p }) => prisma.room.findUnique({ where: { id: p.roomId }, include: { property: { select: { name: true } } } }),
    summary: ({ pre, body }) => {
      const parts = [];
      if (body.rentAmount !== undefined && Number(body.rentAmount) !== Number(pre?.rentAmount))
        parts.push(`rent ${naira(pre?.rentAmount)} → ${naira(body.rentAmount)}`);
      if (body.rentFrequency !== undefined && body.rentFrequency !== pre?.rentFrequency)
        parts.push(`rent period ${FREQ[pre?.rentFrequency]} → ${FREQ[body.rentFrequency]}`);
      if (body.roomNumber !== undefined && body.roomNumber !== pre?.roomNumber) parts.push(`number ${pre?.roomNumber} → ${body.roomNumber}`);
      if (body.status !== undefined && body.status !== pre?.status) parts.push(`status ${pre?.status?.toLowerCase()} → ${String(body.status).toLowerCase()}`);
      return `Edited room ${pre?.roomNumber} in ${pre?.property?.name}${parts.length ? `: ${parts.join(", ")}` : ""}`;
    },
    entity: ({ p }) => p.roomId,
  }),
  R("DELETE", "^/rooms/(?<roomId>[^/]+)$", {
    action: "ROOM_DELETED",
    category: "properties",
    before: ({ p }) => prisma.room.findUnique({ where: { id: p.roomId }, include: { property: { select: { name: true } } } }),
    summary: ({ pre }) => `Deleted room ${pre?.roomNumber} from ${pre?.property?.name}`,
    entity: ({ p }) => p.roomId,
  }),

  // Messages, maintenance, notices, house rules
  R("POST", "^/tenants/(?<tenantId>[^/]+)/complaints$", {
    action: "COMPLAINT_LOGGED",
    category: "messages",
    before: ({ p }) => tenantInfo(p.tenantId),
    summary: ({ pre }) => `Logged a complaint on behalf of ${pre?.name}`,
    entity: ({ res }) => res?.id,
  }),
  R("PUT", "^/complaints/(?<complaintId>[^/]+)$", {
    action: "COMPLAINT_UPDATED",
    category: "messages",
    before: ({ p }) => prisma.complaint.findUnique({ where: { id: p.complaintId }, include: { tenant: { select: { name: true } } } }),
    summary: ({ pre, body }) => {
      const fields = changedFields(pre, body, { status: "status", priority: "priority", category: "category", assignedToId: "assigned person" });
      return `Updated ${pre?.tenant?.name}'s message${fields.length ? `: changed ${fields.join(", ")}` : ""}`;
    },
    entity: ({ p }) => p.complaintId,
  }),
  R("PUT", "^/complaints/(?<complaintId>[^/]+)/respond$", {
    action: "COMPLAINT_REPLIED",
    category: "messages",
    before: ({ p }) => prisma.complaint.findUnique({ where: { id: p.complaintId }, include: { tenant: { select: { name: true } } } }),
    summary: ({ pre }) => `Replied to ${pre?.tenant?.name}'s message`,
    entity: ({ p }) => p.complaintId,
  }),
  R("PUT", "^/maintenance/(?<requestId>[^/]+)$", {
    action: "MAINTENANCE_UPDATED",
    category: "messages",
    before: ({ p }) => prisma.maintenanceRequest.findUnique({ where: { id: p.requestId }, include: { tenant: { select: { name: true } } } }),
    summary: ({ pre, body }) =>
      `Marked maintenance request "${pre?.title}" (${pre?.tenant?.name}) as ${String(body.status || pre?.status).toLowerCase().replace("_", " ")}`,
    entity: ({ p }) => p.requestId,
  }),
  R("POST", "^/notices$", {
    action: "NOTICE_SENT",
    category: "messages",
    summary: ({ res, body }) =>
      `Sent notice "${res?.title}" to ${body.tenantId ? "one tenant" : body.propertyId ? "one property" : "all tenants"}`,
    entity: ({ res }) => res?.id,
  }),
  R("DELETE", "^/notices/(?<noticeId>[^/]+)$", {
    action: "NOTICE_DELETED",
    category: "messages",
    before: ({ p }) => prisma.notice.findUnique({ where: { id: p.noticeId } }),
    summary: ({ pre }) => `Deleted notice "${pre?.title}"`,
    entity: ({ p }) => p.noticeId,
  }),
  R("PUT", "^/house-rules$", {
    action: "HOUSE_RULES_UPDATED",
    category: "messages",
    summary: ({ body }) => `Updated the house rules${body.propertyId ? " for one property" : " (general)"}`,
  }),
  R("DELETE", "^/house-rules/(?<rulesId>[^/]+)$", {
    action: "HOUSE_RULES_DELETED",
    category: "messages",
    summary: () => "Deleted a set of house rules",
  }),

  // Team and account security
  R("POST", "^/secretaries/invite$", {
    action: "SECRETARY_INVITED",
    category: "team",
    summary: ({ res, body }) => `Invited secretary ${res?.name || body.name} (${res?.email || body.email})`,
    entity: ({ res }) => res?.id,
  }),
  R("DELETE", "^/secretaries/(?<secretaryId>[^/]+)$", {
    action: "SECRETARY_REMOVED",
    category: "team",
    before: ({ p }) => prisma.secretary.findUnique({ where: { id: p.secretaryId } }),
    summary: ({ pre }) => `Removed secretary ${pre?.name} (${pre?.email})`,
    entity: ({ p }) => p.secretaryId,
  }),
  R("POST", "^/landlord/payout$", {
    action: "PAYOUT_ACCOUNT_CHANGED",
    category: "account",
    summary: ({ body }) =>
      `Changed the payout bank account — online rent now goes to ${body.businessName}, account ending ${String(body.accountNumber || "").slice(-4)}`,
  }),
  R("PUT", "^/(landlord|secretary)/profile$", {
    action: "PROFILE_UPDATED",
    category: "account",
    summary: () => "Updated their profile details",
  }),
  R("POST", "^/auth/(landlord|secretary)/change-password$", {
    action: "PASSWORD_CHANGED",
    category: "account",
    summary: () => "Changed their password",
  }),
];

const nameCache = new Map();
async function actorName(auth) {
  const key = `${auth.role}:${auth.id}`;
  if (nameCache.has(key)) return nameCache.get(key);
  const model = auth.role === "landlord" ? prisma.landlord : prisma.secretary;
  const row = await model.findUnique({ where: { id: auth.id }, select: { name: true } });
  const name = row?.name || "Unknown";
  nameCache.set(key, name);
  return name;
}

function staffActivity(req, res, next) {
  const rule = RULES.find((r) => r.method === req.method && r.regex.test(req.path));
  if (!rule) return next();
  const p = req.path.match(rule.regex).groups || {};

  // Keep the JSON the route sends, so summaries can use what was created.
  let resBody;
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    resBody = body;
    return originalJson(body);
  };

  res.on("finish", async () => {
    try {
      const auth = req.auth;
      if (!auth || (auth.role !== "landlord" && auth.role !== "secretary")) return;
      if (res.statusCode >= 400) return;
      const ctx = { p, body: req.body || {}, res: resBody?.data, pre: req._activityBefore };
      const landlordId = auth.role === "landlord" ? auth.id : auth.landlordId;
      await prisma.staffActivity.create({
        data: {
          landlordId,
          actorId: auth.id,
          actorRole: auth.role.toUpperCase(),
          actorName: await actorName(auth),
          action: rule.action,
          category: rule.category,
          summary: rule.summary(ctx).slice(0, 500),
          entityId: rule.entity ? rule.entity(ctx) || null : null,
          details: rule.details ? rule.details(ctx) : undefined,
          ipAddress: req.ip || null,
        },
      });
    } catch (err) {
      console.error("Activity log write failed:", err.message);
    }
  });

  if (!rule.before) return next();
  Promise.resolve(rule.before({ p, body: req.body || {} }))
    .then((pre) => {
      req._activityBefore = pre;
    })
    .catch(() => {})
    .finally(() => next());
}

module.exports = { staffActivity };
