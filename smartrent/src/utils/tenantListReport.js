// Printable, branded tenant list for one property. Rendered into a hidden
// iframe and handed to the browser's print dialog (which also offers
// "Save as PDF"), so nothing is uploaded anywhere.

const STATUS = {
  PAID: { label: "Paid", bg: "#22a447", fg: "#ffffff" },
  PARTIAL: { label: "Part Paid", bg: "#f6b04a", fg: "#3b2a07" },
  OWING: { label: "Owing", bg: "#ec5b62", fg: "#ffffff" },
  NO_PAYMENTS: { label: "No Payments", bg: "#e5e9f0", fg: "#475569" },
};

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

function shortDate(value) {
  if (!value) return "—";
  return new Date(value).toISOString().slice(0, 10);
}

function generatedStamp(now) {
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} &nbsp;•&nbsp; ${time}`;
}

// Simple city-skyline mark, drawn inline so the printout needs no assets.
function logoSvg(size, color, windowColor) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="${color}" aria-hidden="true">
    <rect x="4" y="24" width="16" height="36"/><rect x="24" y="12" width="18" height="48"/><rect x="34" y="4" width="8" height="10"/>
    <rect x="46" y="20" width="14" height="40"/>
    <g fill="${windowColor}">
      <rect x="8" y="30" width="3" height="5"/><rect x="13" y="30" width="3" height="5"/><rect x="8" y="40" width="3" height="5"/><rect x="13" y="40" width="3" height="5"/>
      <rect x="28" y="18" width="4" height="6"/><rect x="35" y="18" width="4" height="6"/><rect x="28" y="30" width="4" height="6"/><rect x="35" y="30" width="4" height="6"/>
      <rect x="28" y="42" width="4" height="6"/><rect x="35" y="42" width="4" height="6"/>
      <rect x="50" y="26" width="3" height="5"/><rect x="55" y="26" width="3" height="5"/><rect x="50" y="36" width="3" height="5"/><rect x="55" y="36" width="3" height="5"/>
    </g>
  </svg>`;
}

const ICONS = {
  users: `<svg width="26" height="26" viewBox="0 0 24 24" fill="#1f3a68"><circle cx="9" cy="8" r="4"/><path d="M1 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/><circle cx="17.5" cy="9" r="3"/><path d="M17 14c3.5.2 6 2.4 6 6h-4.5c0-2.4-.6-4.4-1.5-6z"/></svg>`,
  check: `<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#22a447"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  alert: `<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#e0353d"/><rect x="10.8" y="5.5" width="2.4" height="8.5" rx="1.2" fill="#fff"/><circle cx="12" cy="17.5" r="1.5" fill="#fff"/></svg>`,
  clock: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef7d22" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6.5V12l3.5 2.5"/></svg>`,
  pin: `<svg width="34" height="34" viewBox="0 0 24 24" fill="#1f3a68"><path d="M12 1.5a7.5 7.5 0 0 0-7.5 7.5c0 5.6 7.5 13.5 7.5 13.5s7.5-7.9 7.5-13.5A7.5 7.5 0 0 0 12 1.5zm0 10.3a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/></svg>`,
  printer: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#1f3a68"><path d="M6 2h12v5H6z"/><path d="M3 8h18a2 2 0 0 1 2 2v7h-4v5H5v-5H1v-7a2 2 0 0 1 2-2zm4 9v3h10v-3z"/></svg>`,
};

export function buildTenantListHtml({ property, tenants, isCommercial }) {
  const occupantWord = isCommercial ? "Shop Owner" : "Tenant";
  const roomWord = isCommercial ? "Unit" : "Room";
  const now = new Date();
  const stamp = generatedStamp(now);
  const fileName = `${property.name}-${occupantWord.toLowerCase().replace(" ", "-")}s`;

  const count = (status) => tenants.filter((t) => (t.lastPaymentStatus || "NO_PAYMENTS") === status).length;

  const rows = tenants
    .map((t, i) => {
      const s = STATUS[t.lastPaymentStatus || "NO_PAYMENTS"];
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(t.name)}</td>
        <td>${esc(t.email || "—")}</td>
        <td>${esc(t.room?.roomNumber || "—")}</td>
        <td>${esc(t.phone || "—")}</td>
        <td class="c"><span class="pill" style="background:${s.bg};color:${s.fg}">${s.label}</span></td>
        <td>${naira(t.outstanding)}</td>
        <td>${Number(t.outstanding) > 0 ? shortDate(t.nextDueDate) : "—"}</td>
        <td>${shortDate(t.dateExpiration)}</td>
      </tr>`;
    })
    .join("");

  const card = (icon, label, value, bg, border) =>
    `<div class="card" style="background:${bg};border-color:${border}">${icon}<div class="card-label">${label}</div><div class="card-value">${value}</div></div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(fileName)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; }
  .page { padding: 28px 32px 0; }
  .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 22px; border-bottom: 1.5px solid #dbe4f0; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-name { font-size: 40px; font-weight: 800; color: #1f3a68; line-height: 1; letter-spacing: -0.5px; }
  .brand-sub { font-size: 19px; color: #4a6aa5; margin-top: 4px; }
  .tagline { margin-top: 10px; font-size: 14px; color: #7d93b8; }
  .prop { display: flex; align-items: center; gap: 16px; padding-left: 40px; border-left: 1.5px solid #dbe4f0; }
  .prop-kicker { font-size: 12px; font-weight: 700; letter-spacing: 1.2px; color: #1f3a68; }
  .prop-name { font-size: 26px; font-weight: 800; color: #1f3a68; margin: 2px 0; }
  .prop-addr { font-size: 15px; color: #475569; }
  .title-row { display: flex; justify-content: space-between; align-items: flex-start; margin: 24px 0 18px; }
  h1 { margin: 0; font-size: 40px; font-weight: 800; color: #0f2547; }
  .lede { margin-top: 6px; font-size: 15px; color: #4a6aa5; }
  .gen { display: flex; gap: 10px; align-items: center; font-size: 12px; color: #334155; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #dbe4f0; border-radius: 8px; overflow: hidden; font-size: 13px; }
  thead th { background: #1f3a68; color: #fff; font-weight: 600; text-align: left; padding: 13px 14px; border-right: 1px solid #34507f; }
  thead th:last-child, tbody td:last-child { border-right: 0; }
  tbody td { padding: 11px 14px; border-top: 1px solid #e3e9f2; border-right: 1px solid #e3e9f2; }
  tbody tr { page-break-inside: avoid; }
  .c { text-align: center; }
  .pill { display: inline-block; min-width: 78px; padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-align: center; }
  .bottom { display: flex; gap: 22px; margin: 24px 0; page-break-inside: avoid; }
  .panel { background: #f5f8fc; border: 1px solid #e3e9f2; border-radius: 10px; padding: 16px 22px 20px; }
  .panel h2 { margin: 0 0 14px; font-size: 18px; color: #1f3a68; }
  .cards { display: flex; gap: 18px; }
  .card { flex: 1; border: 1px solid; border-radius: 8px; padding: 14px 18px; min-width: 120px; }
  .card-label { margin-top: 8px; font-size: 15px; color: #334155; }
  .card-value { font-size: 30px; font-weight: 800; color: #0f2547; }
  .details { flex: 0 0 400px; }
  .details dl { display: grid; grid-template-columns: 150px 1fr; row-gap: 10px; margin: 0; font-size: 14px; }
  .details dt { font-weight: 600; color: #1e293b; }
  .details dd { margin: 0; color: #334155; }
  .foot { display: flex; justify-content: space-between; align-items: center; background: #1f3a68; color: #fff; padding: 16px 32px; page-break-inside: avoid; }
  .foot-brand { display: flex; align-items: center; gap: 12px; }
  .foot-name { font-weight: 700; font-size: 17px; }
  .foot-sub { font-size: 11px; color: #c7d4ea; }
  .foot-mid { font-size: 15px; }
  .foot-right { text-align: right; font-size: 12px; line-height: 1.6; }
</style></head>
<body>
  <div class="page">
    <div class="head">
      <div>
        <div class="brand">${logoSvg(82, "#1f3a68", "#ffffff")}<div><div class="brand-name">Rentaflow</div><div class="brand-sub">Property Management</div></div></div>
        <div class="tagline">Better Tenants &nbsp;•&nbsp; Smoother Payments &nbsp;•&nbsp; Greater Peace of Mind</div>
      </div>
      <div class="prop">${ICONS.pin}<div><div class="prop-kicker">PROPERTY</div><div class="prop-name">${esc(property.name)}</div><div class="prop-addr">${esc(property.address)}</div></div></div>
    </div>

    <div class="title-row">
      <div><h1>${occupantWord} List</h1><div class="lede">This list shows all ${occupantWord.toLowerCase()}s for the selected property, based on your current search, filters and sort order.</div></div>
      <div class="gen">${ICONS.printer}<div>Generated on<br>${stamp}</div></div>
    </div>

    <table>
      <thead><tr><th class="c">#</th><th>Name</th><th>Email</th><th>${roomWord}</th><th>Phone</th><th class="c">Payment Status</th><th>Outstanding</th><th>Next Payment Due</th><th>Lease Ends</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="9" class="c">No ${occupantWord.toLowerCase()}s match the current filters.</td></tr>`}</tbody>
    </table>

    <div class="bottom">
      <div class="panel" style="flex:1">
        <h2>Summary</h2>
        <div class="cards">
          ${card(ICONS.users, `Total ${occupantWord}s`, tenants.length, "#eaf2fd", "#cfe0f7")}
          ${card(ICONS.check, "Paid", count("PAID"), "#eaf8ee", "#cdebd6")}
          ${card(ICONS.alert, "Owing", count("OWING"), "#fdecee", "#f6cfd3")}
          ${card(ICONS.clock, "Part Paid", count("PARTIAL"), "#fef3e6", "#f8dcb8")}
        </div>
      </div>
      <div class="panel details">
        <h2>Property Details</h2>
        <dl>
          <dt>Property Name:</dt><dd>${esc(property.name)}</dd>
          <dt>Location:</dt><dd>${esc(property.address)}</dd>
          <dt>Total ${roomWord}s:</dt><dd>${property.stats?.totalRooms ?? "—"}</dd>
          <dt>Total ${occupantWord}s:</dt><dd>${property.stats?.tenantCount ?? tenants.length}</dd>
        </dl>
      </div>
    </div>
  </div>

  <div class="foot">
    <div class="foot-brand">${logoSvg(36, "#ffffff", "#1f3a68")}<div><div class="foot-name">Rentaflow</div><div class="foot-sub">Property Management</div></div></div>
    <div class="foot-mid">Simple. Secure. Efficient.</div>
    <div class="foot-right">Generated on ${stamp}<br>${esc(fileName)}.pdf</div>
  </div>
</body></html>`;
}

export function printTenantList(options) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(buildTenantListHtml(options));
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
