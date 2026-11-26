import { FaWhatsapp, FaPhoneAlt, FaEnvelope, FaQuestionCircle } from "react-icons/fa";
import { SUPPORT, hasSupportContact } from "../../config/support";

const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";

// "Need help?" box: in the sidebar (dark) and on Settings (light).
export default function HelpBox({ dark = false }) {
  if (!hasSupportContact) return null;
  const msg = encodeURIComponent("Hello, I need help with RentaFlow.");
  const links = [
    SUPPORT.whatsapp && { href: `https://wa.me/${SUPPORT.whatsapp}?text=${msg}`, label: "WhatsApp us", icon: FaWhatsapp, external: true },
    SUPPORT.phone && { href: `tel:${SUPPORT.phone.replace(/\s/g, "")}`, label: `Call ${SUPPORT.phone}`, icon: FaPhoneAlt },
    SUPPORT.email && { href: `mailto:${SUPPORT.email}?subject=${encodeURIComponent("RentaFlow help")}`, label: "Email us", icon: FaEnvelope },
  ].filter(Boolean);

  const box = dark ? "bg-[#6E2020]/60 text-white" : "border border-site-border bg-[#FBF3E3] text-site-text";
  const sub = dark ? "text-[#E8DADA]" : "text-site-muted";
  const link = dark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-[#F6E7BC] text-brand-700 border border-site-border";

  return (
    <div className={`rounded-2xl p-3.5 ${box}`}>
      <div className="flex items-center gap-2 text-sm font-bold">
        <FaQuestionCircle className="text-gold-500" aria-hidden="true" /> Need help?
      </div>
      <p className={`m-0 mt-1 text-xs leading-relaxed ${sub}`}>Questions about using RentaFlow? We're here {SUPPORT.hours}.</p>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.external && { target: "_blank", rel: "noopener noreferrer" })}
            className={`flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition ${link} ${ring}`}
          >
            <l.icon size={14} aria-hidden="true" /> {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
