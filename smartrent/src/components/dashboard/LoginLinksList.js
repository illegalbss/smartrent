import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaCopy, FaCheck } from "react-icons/fa";
import { tenantsApi } from "../../api/tenants";
import { whatsappUrl, loginLinkMessage } from "../../utils/whatsapp";

// Ticks are only a convenience for working down the list on this device —
// sending happens in WhatsApp, which we can't observe.
const SENT_KEY = "rentaflow_login_links_sent";

function loadSent() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSent(sent) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(sent));
  } catch {
    // Private mode / storage blocked — ticks just won't persist.
  }
}

function linkFor(token) {
  return `${window.location.origin}/accept-invite?token=${token}&role=tenant`;
}

export default function LoginLinksList({ propertyId, roomWord = "Room" }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(loadSent);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    tenantsApi
      .loginLinks(propertyId)
      .then((res) => setItems(res.data))
      .catch((err) => setError(err.message));
  }, [propertyId]);

  function markSent(id) {
    const next = { ...sent, [id]: true };
    setSent(next);
    saveSent(next);
  }

  function copy(item) {
    navigator.clipboard?.writeText(linkFor(item.inviteToken));
    setCopiedId(item.id);
    markSent(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (error) return <p className="text-sm font-medium text-red-600">{error}</p>;
  if (!items) return <p className="text-sm text-ink-500">Preparing links…</p>;
  if (items.length === 0) {
    return <p className="text-sm text-ink-600">Everyone here has already set up their login. Nothing to send.</p>;
  }

  const ready = items.filter((i) => i.inviteToken);
  const missingPhone = items.filter((i) => !i.inviteToken);
  const sentCount = ready.filter((i) => sent[i.id]).length;

  return (
    <div>
      <p className="text-sm text-ink-600">
        These tenants haven't set up their login yet. Tap <span className="font-semibold">WhatsApp</span> next to each name to send
        their personal link — they open it, choose a password, then log in with their phone number.
      </p>
      <p className="mt-2 text-xs font-semibold text-brand-700">
        {sentCount} of {ready.length} sent on this device
      </p>

      <ul className="mt-3 divide-y divide-ink-100 rounded-xl border border-ink-100">
        {ready.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-800">
                {sent[item.id] && <FaCheck size={11} className="shrink-0 text-green-600" />}
                <span className="truncate">{item.name}</span>
              </div>
              <div className="truncate text-xs text-ink-400">
                {item.roomNumber ? `${roomWord} ${item.roomNumber} · ` : ""}
                {item.phone || item.email}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {item.phone && (
                <a
                  href={whatsappUrl(item.phone, loginLinkMessage(item.name, linkFor(item.inviteToken)))}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => markSent(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  <FaWhatsapp size={13} /> WhatsApp
                </a>
              )}
              <button
                onClick={() => copy(item)}
                title="Copy link (for SMS)"
                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-bold text-ink-600 hover:bg-ink-50"
              >
                {copiedId === item.id ? <FaCheck size={11} /> : <FaCopy size={11} />}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {missingPhone.length > 0 && (
        <div className="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
          <p className="font-semibold">No phone number yet — add one to send their link:</p>
          <ul className="mt-1.5 space-y-1">
            {missingPhone.map((item) => (
              <li key={item.id}>
                <Link to={`/dashboard/staff/tenants/${item.id}`} className="font-medium underline hover:text-amber-900">
                  {item.name}
                </Link>{" "}
                <span className="text-xs">(open → Edit Tenant → add phone)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
