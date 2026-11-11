import { Link } from "react-router-dom";
import { SitePage, Eyebrow, SiteButton, CtaBand, StatusChip } from "../components/site/SiteUi";

// Sample figures for the hero's dashboard preview — display only.
const PREVIEW_TENANTS = [
  { name: "Chinedu Eze", unit: "Flat 2B", status: "Overdue" },
  { name: "Amaka Obi", unit: "Flat 4A", status: "Part-paid" },
  { name: "Ngozi Stores", unit: "Shop 4", status: "Paid" },
];

const TRUST = ["Flats and shops", "Landlord, accountant and tenant logins", "Works on any phone", "Your records stay private"];

const icon = (d) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    {d}
  </svg>
);

const FEATURES = [
  {
    title: "Rent records",
    body: "Record every payment, see part-payments and arrears at a glance, and give a receipt in seconds.",
    icon: icon(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
  },
  {
    title: "Tenants and shop owners",
    body: "Keep each person, unit, rent amount and due date together, for flats and for shops.",
    icon: icon(<><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-4 3-6 7-6s7 2 7 6" /></>),
  },
  {
    title: "Safe documents",
    body: "Store agreements and IDs privately. Only you and your accountant can open them.",
    icon: icon(<><path d="M6 2h9l5 5v15H6z" /><path d="M14 2v6h6" /></>),
  },
  {
    title: "Reminders",
    body: "See who is due and who is late, and send a polite reminder on WhatsApp in one tap.",
    icon: icon(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  },
  {
    title: "Simple reports",
    body: "Monthly income, arrears and a full payment history you can download.",
    icon: icon(<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />),
  },
  {
    title: "Private by design",
    body: "Every landlord sees only their own data, and every change is written to a history log.",
    icon: icon(<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />),
  },
];

const STEPS = [
  { title: "Add your property", body: "List your buildings and units, flats or shops, with the rent for each." },
  { title: "Add your tenants", body: "Enter each tenant, their phone number and when rent is due." },
  { title: "Record payments", body: "When money arrives, record it, send the receipt, and watch your dashboard update." },
];

const ROLES = [
  { title: "Landlord", body: "Full control of properties, tenants and payments." },
  { title: "Secretary or accountant", body: "Records payments and prepares reports for you." },
  { title: "Tenant or shop owner", body: "Sees their own balance and receipts only." },
];

const h2 = "m-0 mt-2.5 font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1]";

function DashboardPreview() {
  return (
    <div className="relative min-w-0 flex-[1_1_400px] pb-8 pt-4" aria-label="Example RentaFlow dashboard with sample figures" role="img">
      <div className="mx-auto max-w-[480px] overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_rgba(60,10,10,0.18)]">
        <div className="bg-brand-700 px-6 pb-10 pt-5 text-white">
          <div className="text-[13px] text-[#F3D9A0]">Collected this month</div>
          <div className="font-display text-[38px] font-bold">₦1,240,000</div>
        </div>
        <div className="-mt-[22px] px-6 pb-2">
          <div className="rounded-xl bg-white px-3.5 py-3 shadow-[0_4px_14px_rgba(60,10,10,0.1)]">
            <div className="h-2 overflow-hidden rounded bg-[#EEE6D8]">
              <div className="h-full w-[78%] bg-gold-500" />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-site-muted">
              <span>78% of expected</span>
              <span>₦1,590,000</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 px-6 pb-6 pt-2">
          {PREVIEW_TENANTS.map((t, i) => (
            <div key={t.name} className={`flex items-center gap-3 py-2.5 ${i < PREVIEW_TENANTS.length - 1 ? "border-b border-[#EEE6D8]" : ""}`}>
              <div className="flex-grow">
                <div className="text-[15px] font-semibold">{t.name}</div>
                <div className="text-[13px] text-site-muted">{t.unit}</div>
              </div>
              <StatusChip status={t.status} />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_32px_rgba(60,10,10,0.2)]">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="16" fill="#E3F2E7" />
          <path d="M11 18.5l5 5 9-10" fill="none" stroke="#1F6B3A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <div className="text-sm font-bold">Payment saved</div>
          <div className="text-xs text-site-muted">Receipt RF-2026-0142</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <SitePage>
      {/* 1. Hero */}
      <section>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-20 pt-[72px]">
          <div className="min-w-0 flex-[1_1_440px]">
            <div className="inline-block rounded-full bg-[#F6E7BC] px-3.5 py-1.5 text-[13px] font-semibold text-[#5A4100]">
              Made for Nigerian landlords
            </div>
            <h1 className="m-0 mt-5 font-display text-[clamp(38px,5.4vw,66px)] font-bold leading-[1.05]">
              Know who has paid. Every month. Without the stress.
            </h1>
            <p className="m-0 mt-5 max-w-[520px] text-[19px] leading-relaxed text-site-muted">
              RentaFlow keeps your tenants, rent records and documents in one safe place, so you stop chasing notebooks and
              WhatsApp messages.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SiteButton to="/register">Get started</SiteButton>
              <SiteButton href="#how" variant="outline">See how it works</SiteButton>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* 2. Trust strip */}
      <section className="border-y border-site-border bg-white">
        <ul className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-10 gap-y-4 px-6 py-7 text-[15px] font-semibold text-brand-700">
          {TRUST.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      {/* 3. Everything in one place */}
      <section className="mx-auto max-w-[1200px] px-6 pb-6 pt-[88px]">
        <div className="max-w-[640px]">
          <Eyebrow>EVERYTHING IN ONE PLACE</Eyebrow>
          <h2 className={h2}>Less paperwork. More peace of mind.</h2>
        </div>
        <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          {FEATURES.map((f) => (
            <Link
              key={f.title}
              to="/features"
              className="block rounded-[18px] bg-white p-7 transition-[transform,box-shadow] duration-[250ms] hover:shadow-[0_12px_28px_rgba(60,10,10,0.14)] motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#F6E7BC] text-brand-700">{f.icon}</div>
              <h3 className="m-0 mt-[18px] text-[19px] font-bold">{f.title}</h3>
              <p className="m-0 mt-2 leading-relaxed text-site-muted">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. How it works */}
      <section id="how" className="mx-auto max-w-[1200px] scroll-mt-4 px-6 pb-6 pt-[72px]">
        <div className="max-w-[640px]">
          <Eyebrow>HOW IT WORKS</Eyebrow>
          <h2 className={h2}>Set up in an afternoon.</h2>
        </div>
        <ol className="m-0 mt-10 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 font-display text-[22px] font-bold text-[#F3D9A0]">
                {i + 1}
              </div>
              <h3 className="m-0 mt-4 text-xl font-bold">{s.title}</h3>
              <p className="m-0 mt-2 leading-relaxed text-site-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. A login for everyone */}
      <section className="mx-auto max-w-[1200px] px-6 pb-6 pt-[72px]">
        <div className="flex flex-wrap items-center gap-8 rounded-3xl bg-site-deep px-6 py-12 text-white sm:px-10">
          <div className="flex-[1_1_360px]">
            <Eyebrow light>A LOGIN FOR EVERYONE</Eyebrow>
            <h2 className="m-0 mt-2.5 font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.1]">The right access for each person.</h2>
          </div>
          <div className="grid flex-[2_1_460px] grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-4">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-2xl bg-[#431010] p-5">
                <h3 className="m-0 text-base font-bold text-[#F3D9A0]">{r.title}</h3>
                <p className="m-0 mt-1.5 text-sm leading-normal text-[#E8DADA]">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing teaser */}
      <section className="mx-auto max-w-[1200px] px-6 pb-6 pt-[72px] text-center">
        <h2 className="m-0 font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1]">Simple monthly plans.</h2>
        <p className="mx-auto mb-0 mt-3.5 max-w-[560px] text-lg leading-relaxed text-site-muted">
          Pick a flat price based on how many units you manage.
        </p>
        <SiteButton to="/pricing" variant="outline" className="mt-6">See pricing</SiteButton>
      </section>

      {/* 7. Final call to action */}
      <CtaBand title="Ready to stop chasing rent in notebooks?">
        <SiteButton to="/register" variant="gold">Get started</SiteButton>
      </CtaBand>
    </SitePage>
  );
}
