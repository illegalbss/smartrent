// Printable, branded documents (rent collection report, tenant statement).
// Rendered into a hidden iframe and handed to the browser's print dialog,
// which also offers "Save as PDF" — nothing is uploaded anywhere.

const NAVY = "#1f3a68";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function naira(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

function longDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function stampNow() {
  const now = new Date();
  return `${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

const FREQ = { MONTHLY: "month", QUARTERLY: "quarter", YEARLY: "year" };

// Manual payments carry "Method: X" at the start of their notes.
export function methodOf(p) {
  if (p.source === "PAYSTACK") return "Online";
  const m = /^Method:\s*([^·]+)/.exec(p.notes || "");
  return m ? m[1].trim() : "—";
}
function remarksOf(p) {
  return (p.notes || "").replace(/^Method:\s*[^·]+(·\s*)?/, "").trim() || "—";
}

const CHIP = {
  PAID: { label: "Paid", bg: "#e3f2e7", fg: "#1f6b3a" },
  PARTIAL: { label: "Partial", bg: "#fff1cc", fg: "#6b4e00" },
  OWING: { label: "Owing", bg: "#fbe6e6", fg: "#8a1c1c" },
  OVERDUE: { label: "Overdue", bg: "#fbe6e6", fg: "#8a1c1c" },
  NONE: { label: "No payments", bg: "#eeeae3", fg: "#4a443d" },
};
const chip = (key) => {
  const c = CHIP[key] || CHIP.NONE;
  return `<span class="chip" style="background:${c.bg};color:${c.fg}">${c.label}</span>`;
};

const HOUSE = (size, fill, door) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 3 22h6v21h30V22h6z" fill="${fill}"/><rect x="19" y="27" width="10" height="16" fill="${door}"/><rect x="21" y="15" width="6" height="6" fill="${door}"/></svg>`;

const BASE_CSS = `
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; font-size: 13px; }
  .page { padding: 18px 22px 0; }
  .brandbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 14px; border-bottom: 2px solid #dbe4f0; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-name { font-size: 34px; font-weight: 800; color: ${NAVY}; line-height: 1; }
  .brand-sub { font-size: 14px; color: #334155; margin-top: 3px; }
  .doc-title { text-align: right; }
  .doc-title h1 { margin: 0; font-size: 26px; font-weight: 800; color: ${NAVY}; }
  .doc-title .sub { font-style: italic; color: #334155; margin-top: 2px; }
  .band { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 14px 0; padding: 14px 20px; border-radius: 12px; background: ${NAVY}; color: #fff; }
  .band .big { font-size: 22px; font-weight: 700; }
  .band .meta { font-size: 13px; line-height: 1.7; }
  .band .meta b { display: inline-block; min-width: 110px; font-weight: 600; }
  .cards { display: flex; gap: 12px; margin-bottom: 14px; }
  .card { flex: 1; border: 1px solid; border-radius: 10px; padding: 12px 14px; text-align: center; }
  .card .label { font-size: 13px; font-weight: 600; color: #1e293b; }
  .card .value { font-size: 24px; font-weight: 800; margin-top: 4px; }
  .card .pct { font-size: 12px; font-weight: 700; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #c9d6ea; border-radius: 10px; overflow: hidden; }
  thead th { background: ${NAVY}; color: #fff; font-weight: 600; text-align: left; padding: 9px 10px; }
  tbody td { padding: 8px 10px; border-top: 1px solid #e3e9f2; }
  tbody tr:nth-child(even) td { background: #f7f9fd; }
  tbody tr { page-break-inside: avoid; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.c, th.c { text-align: center; }
  .chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
  .row { display: flex; gap: 14px; margin-top: 14px; page-break-inside: avoid; }
  .box { flex: 1; border: 1px solid #c9d6ea; border-radius: 10px; overflow: hidden; }
  .box h2 { margin: 0; padding: 8px 14px; background: ${NAVY}; color: #fff; font-size: 15px; }
  .box .in { padding: 10px 14px; }
  .kv { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; }
  .kv dt { font-weight: 600; }
  .kv dd { margin: 0; text-align: right; }
  .note { background: #eef4fc; }
  .note ol, .note ul { margin: 0; padding-left: 18px; line-height: 1.7; }
  .sign { flex: 0 0 210px; display: flex; flex-direction: column; justify-content: flex-end; text-align: center; padding-bottom: 6px; }
  .sign .line { border-top: 1.5px solid #334155; margin: 46px 6px 6px; }
  .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding: 10px 22px; background: ${NAVY}; color: #fff; font-size: 12px; }
  .green { color: #1f6b3a; } .red { color: #8a1c1c; } .amber { color: #8c670c; }
`;

function brandBar(title, sub) {
  return `<div class="brandbar">
    <div class="brand">${HOUSE(60, NAVY, "#ffffff")}<div><div class="brand-name">Rentaflow</div><div class="brand-sub">Manage · Track · Collect</div></div></div>
    <div class="doc-title"><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div></div>
  </div>`;
}

function shell(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_CSS}</style></head>
<body><div class="page">${body}</div>
<div class="foot"><span><b>Rentaflow</b> — Rent records for Nigerian landlords</span><span>Generated on ${esc(stampNow())}</span></div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Property Rent Collection Report
// rows: [{ name, room, rent, rentFrequency, paid, balance, status }]
// status is one of PAID | PARTIAL | OWING | OVERDUE | NONE
export function buildRentCollectionHtml({ property, rows, periodStart, periodEnd, isCommercial }) {
  const roomWord = isCommercial ? "Unit" : "Room";
  const n = rows.length || 1;
  const count = (keys) => rows.filter((r) => keys.includes(r.status)).length;
  const paidCount = count(["PAID"]);
  const partialCount = count(["PARTIAL"]);
  const owingCount = count(["OWING", "OVERDUE", "NONE"]);
  const pct = (k) => `${Math.round((k / n) * 100)}%`;
  const totalRent = rows.reduce((s, r) => s + Number(r.rent || 0), 0);
  const totalPaid = rows.reduce((s, r) => s + Number(r.paid || 0), 0);
  const totalBalance = rows.reduce((s, r) => s + Number(r.balance || 0), 0);
  const REMARK = { PARTIAL: "Part paid", OWING: "Not paid", OVERDUE: "Overdue", NONE: "No payment yet" };

  const body = rows
    .map(
      (r, i) => `<tr>
      <td class="c">${i + 1}</td><td>${esc(r.name)}</td><td>${esc(r.room)}</td>
      <td class="num">${naira(r.rent)}<span style="color:#64748b">/${FREQ[r.rentFrequency] === "year" ? "yr" : FREQ[r.rentFrequency] === "month" ? "mo" : "qtr"}</span></td>
      <td class="num">${naira(r.paid)}</td><td class="num">${naira(r.balance)}</td>
      <td class="c">${chip(r.status)}</td><td>${REMARK[r.status] || "—"}</td></tr>`
    )
    .join("");

  const card = (label, value, sub, bg, border, color) =>
    `<div class="card" style="background:${bg};border-color:${border}"><div class="label">${label}</div><div class="value" style="color:${color}">${value}</div>${
      sub ? `<div class="pct" style="color:${color}">${sub}</div>` : ""
    }</div>`;

  return shell(
    `${property.name} - rent collection report`,
    `${brandBar("Property Rent Collection Report", "Rent records for Nigerian landlords")}
    <div class="band">
      <div style="display:flex;align-items:center;gap:12px">${HOUSE(34, "#ffffff", NAVY)}<div><div class="big">${esc(property.name)}</div><div>${esc(property.address)}</div></div></div>
      <div class="meta"><div><b>Report period:</b> ${longDate(periodStart)} – ${longDate(periodEnd)}</div><div><b>Generated on:</b> ${esc(stampNow())}</div></div>
    </div>
    <div class="cards">
      ${card(`Total ${roomWord}s`, property.stats?.totalRooms ?? rows.length, `${rows.length} occupied`, "#eef4fc", "#c9d6ea", NAVY)}
      ${card("Paid", paidCount, pct(paidCount), "#e8f5ec", "#bfe0c9", "#1f6b3a")}
      ${card("Partially paid", partialCount, pct(partialCount), "#fff6dd", "#f2d27a", "#8c670c")}
      ${card("Outstanding", owingCount, pct(owingCount), "#fdecee", "#f2c4c4", "#8a1c1c")}
      ${card("Rent roll", naira(totalRent), "per rent period", "#eef4fc", "#c9d6ea", NAVY)}
    </div>
    <table>
      <thead><tr><th class="c">S/N</th><th>Tenant name</th><th>${roomWord}</th><th class="num">Rent</th><th class="num">Paid (period)</th><th class="num">Balance now</th><th class="c">Status</th><th>Remarks</th></tr></thead>
      <tbody>${body || `<tr><td colspan="8" class="c">No tenants in this view.</td></tr>`}</tbody>
    </table>
    <div class="row">
      <div class="box"><h2>Summary</h2><div class="in"><dl class="kv">
        <dt>Rent roll (per period):</dt><dd><b>${naira(totalRent)}</b></dd>
        <dt>Collected in report period:</dt><dd class="green"><b>${naira(totalPaid)}</b></dd>
        <dt>Outstanding balance now:</dt><dd class="red"><b>${naira(totalBalance)}</b></dd>
      </dl></div></div>
      <div class="box note"><h2>Important note</h2><div class="in"><ol>
        <li>"Paid (period)" counts payments recorded within the report period.</li>
        <li>"Balance now" is each tenant's balance on the day this report was generated.</li>
        <li>Contact tenants with an outstanding balance.</li>
      </ol></div></div>
      <div class="sign"><div class="line"></div><b>Authorised signature</b><div>Property manager</div></div>
    </div>`
  );
}

// ---------------------------------------------------------------------------
// Tenant Account Statement — `tenant` is the staff tenant-detail payload.
export function buildTenantStatementHtml(tenant) {
  const room = tenant.room;
  const property = room?.property;
  const payments = [...(tenant.payments || [])].sort((a, b) => new Date(a.datePaid) - new Date(b.datePaid));
  const totalPaid = payments.filter((p) => p.status !== "OWING").reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Number(tenant.paymentStatus?.outstanding || 0);
  const totalDue = totalPaid + outstanding;
  const ps = tenant.paymentStatus || {};
  const statusKey = ps.isOverdue ? "OVERDUE" : outstanding > 0 ? "PARTIAL" : payments.length ? "PAID" : "NONE";
  const statusText = { OVERDUE: "Overdue", PARTIAL: "Balance due", PAID: "Up to date", NONE: "No payments yet" }[statusKey];

  const history = payments
    .map(
      (p, i) => `<tr><td class="c">${i + 1}</td><td>${longDate(p.datePaid)}</td><td class="num">${naira(p.amount)}</td>
      <td>${esc(methodOf(p))}</td><td>#${esc(p.id.slice(-8).toUpperCase())}</td><td class="c">${chip(p.status === "OWING" ? "OWING" : p.status)}</td><td>${esc(remarksOf(p))}</td></tr>`
    )
    .join("");

  const card = (label, value, bg, border, color) =>
    `<div class="card" style="background:${bg};border-color:${border}"><div class="label">${label}</div><div class="value" style="color:${color}">${value}</div></div>`;

  return shell(
    `${tenant.name} - account statement`,
    `${brandBar("Tenant Account Statement", "Complete rent history and balance")}
    <div class="band">
      <div><div class="big">${esc(tenant.name)}</div><div>Phone: ${esc(tenant.phone || "—")}${tenant.email ? ` · ${esc(tenant.email)}` : ""}</div></div>
      <div class="meta"><div><b>Property:</b> ${esc(property?.name || "—")}</div><div><b>${property?.propertyType === "COMMERCIAL" ? "Unit" : "Room"}:</b> ${esc(room?.roomNumber || "—")}</div><div><b>Statement date:</b> ${esc(stampNow())}</div></div>
    </div>
    <div class="row" style="margin-top:0">
      <div class="box"><h2>Tenant profile</h2><div class="in"><dl class="kv">
        <dt>Full name</dt><dd>${esc(tenant.name)}</dd>
        <dt>Phone number</dt><dd>${esc(tenant.phone || "—")}</dd>
        <dt>Property</dt><dd>${esc(property?.name || "—")}</dd>
        <dt>Address</dt><dd>${esc(property?.address || "—")}</dd>
        <dt>Tenancy start</dt><dd>${longDate(tenant.dateCommencement)}</dd>
        <dt>Lease ends</dt><dd>${longDate(tenant.dateExpiration)}</dd>
      </dl></div></div>
      <div class="box"><h2>Room account summary</h2><div class="in"><dl class="kv">
        <dt>${property?.propertyType === "COMMERCIAL" ? "Unit" : "Room"} number</dt><dd>${esc(room?.roomNumber || "—")}</dd>
        <dt>Rent per period</dt><dd>${room ? `${naira(room.rentAmount)} / ${FREQ[room.rentFrequency] || "year"}` : "—"}</dd>
        <dt>Amount paid</dt><dd class="green"><b>${naira(totalPaid)}</b></dd>
        <dt>Amount due now</dt><dd class="red"><b>${naira(outstanding)}</b></dd>
        <dt>Status</dt><dd>${chip(statusKey)} ${esc(statusText)}</dd>
      </dl></div></div>
    </div>
    <div class="cards" style="margin-top:14px">
      ${card("Total rent due (to date)", naira(totalDue), "#eef4fc", "#c9d6ea", NAVY)}
      ${card("Total paid", naira(totalPaid), "#e8f5ec", "#bfe0c9", "#1f6b3a")}
      ${card("Outstanding balance", naira(outstanding), "#fdecee", "#f2c4c4", "#8a1c1c")}
      ${card("Next due date", ps.nextDueDate ? longDate(ps.nextDueDate) : "—", "#eef4fc", "#c9d6ea", NAVY)}
    </div>
    <table>
      <thead><tr><th class="c">S/N</th><th>Date</th><th class="num">Amount paid</th><th>Method</th><th>Receipt no.</th><th class="c">Status</th><th>Remarks</th></tr></thead>
      <tbody>${history || `<tr><td colspan="7" class="c">No payments recorded yet.</td></tr>`}</tbody>
    </table>
    <div class="row">
      <div class="box note"><h2>Notes</h2><div class="in"><ul>
        <li>This statement shows every payment recorded and the balance as of the statement date.</li>
        <li>Please settle any outstanding balance before the next due date.</li>
        <li>For any enquiries, contact your property manager.</li>
      </ul></div></div>
      <div class="sign"><div class="line"></div><b>Authorised signature</b><div>Property manager</div></div>
    </div>`
  );
}

// ---------------------------------------------------------------------------
export function printHtml(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.contentWindow.addEventListener("afterprint", cleanup);
  // Give the browser a beat to lay out the document before printing.
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Fallback for browsers that don't fire afterprint on iframes.
    setTimeout(() => iframe.isConnected && iframe.remove(), 60000);
  }, 250);
}
