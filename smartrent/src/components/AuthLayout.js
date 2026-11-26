import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import SiteLogo from "./site/SiteLogo";

const POINTS = [
  "Every payment recorded, with a receipt in seconds",
  "See who has paid, who owes, and who is late",
  "Tenant documents kept private and safe",
  "A history log of every change your staff make",
];

const d = (ms) => ({ "--d": `${ms}ms` });

// Shared by Login, Register, Forgot/Reset password and Accept invite.
// Styled like the public website (cream, maroon, Fraunces headings).
export default function AuthLayout({ children, tagline }) {
  return (
    <div className="flex min-h-screen bg-site-cream font-sans text-site-text">
      <div className="flex w-full flex-col px-5 py-6 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto flex w-full max-w-[440px] items-center justify-between gap-3">
          <SiteLogo compact />
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-site-muted transition hover:bg-[#F6E7BC] hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <FaArrowLeft size={12} aria-hidden="true" /> Back to Home
          </Link>
        </div>
        <div className="flex flex-1 items-center">
          <div className="anim-rise mx-auto mt-8 w-full max-w-[440px] rounded-[22px] border border-site-border bg-white p-6 shadow-[0_18px_44px_rgba(60,10,10,0.08)] sm:p-8 lg:mt-0">
            {children}
          </div>
        </div>
      </div>

      <aside className="relative hidden w-1/2 overflow-hidden bg-site-deep lg:flex lg:items-center">
        {/* soft gold glow (gradients, not blur filters, so it draws fast everywhere) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 85% 10%, rgba(212,160,23,0.22), transparent 45%), radial-gradient(circle at 10% 95%, rgba(140,30,30,0.55), transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[480px] px-12 py-16 text-white">
          <div className="anim-rise inline-block rounded-full bg-[#F6E7BC] px-3.5 py-1.5 text-[13px] font-semibold text-[#5A4100]" style={d(100)}>
            Made for Nigerian landlords
          </div>
          <h2 className="anim-rise m-0 mt-5 font-display text-[40px] font-bold leading-[1.08]" style={d(200)}>
            Know who has paid. Without the stress.
          </h2>
          <p className="anim-rise m-0 mt-4 text-[17px] leading-relaxed text-[#E8DADA]" style={d(300)}>
            {tagline || "Your tenants, rent records and documents in one safe place."}
          </p>
          <ul className="m-0 mt-8 list-none space-y-3.5 p-0">
            {POINTS.map((p, i) => (
              <li key={p} className="anim-rise flex items-start gap-3 text-[15px] text-[#F3E9E9]" style={d(420 + i * 110)}>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-site-deep">
                  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="anim-pop mt-10 inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-site-text shadow-[0_16px_36px_rgba(0,0,0,0.3)]" style={d(1000)}>
            <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="16" fill="#E3F2E7" />
              <path className="anim-check" style={d(1400)} d="M11 18.5l5 5 9-10" fill="none" stroke="#1F6B3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="text-sm font-bold">Payment saved</div>
              <div className="text-xs text-site-muted">Receipt sent to the tenant</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
