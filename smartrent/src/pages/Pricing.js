import { useEffect, useState } from "react";
import { SitePage, Eyebrow, SiteButton, CtaBand } from "../components/site/SiteUi";
import { api } from "../api/client";

// Plans and prices come from the database (Super Admin → Plans and Pricing),
// so this page always shows what landlords are actually charged.
const TAGLINE = {
  Starter: "For one small property",
  Growth: "For a growing portfolio",
  Pro: "For estates and plazas",
};

// Every plan gets every feature — plans differ only by how many rooms/shops.
const INCLUDED = [
  "Rent records, receipts and statements",
  "Tenant and shop-owner records",
  "Phone-number logins and WhatsApp reminders",
  "Secretary or accountant logins",
  "Private documents and history log",
];

const FAQS = [
  {
    q: "Can my tenants pay through RentaFlow?",
    a: "Yes, with the Automatic Payments add-on (paid separately): tenants then pay by card, bank transfer or USSD and the money goes straight to your bank account. Without it, you record cash, transfer or POS payments when you receive them.",
  },
  {
    q: "What happens if I make a mistake on a payment?",
    a: "You can edit or delete it, and every change is kept in the history log with who did it and when.",
  },
  {
    q: "Who can see my tenants' details?",
    a: "Only you and the team members you invite. Other landlords can never see your data.",
  },
];

function formatPrice(price) {
  return `₦${Number(price).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function PlanCard({ plan, featured }) {
  const dark = featured;
  return (
    <div
      className={`relative flex flex-col rounded-[22px] p-8 transition-[transform,box-shadow] duration-[250ms] hover:shadow-[0_12px_28px_rgba(60,10,10,0.14)] motion-safe:hover:-translate-y-1 ${
        dark ? "bg-brand-700 text-white" : "bg-white"
      }`}
    >
      {dark && (
        <div className="absolute -top-3.5 left-8 rounded-xl bg-gold-500 px-3 py-1 text-xs font-bold text-site-text">Recommended</div>
      )}
      <h2 className="m-0 text-xl font-bold">{plan.name}</h2>
      {TAGLINE[plan.name] && <div className={`mt-1 text-[15px] ${dark ? "text-[#E8DADA]" : "text-site-muted"}`}>{TAGLINE[plan.name]}</div>}
      <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-display text-[clamp(36px,10vw,44px)] font-bold">{formatPrice(plan.price)}</span>
        <span className={`whitespace-nowrap ${dark ? "text-[#E8DADA]" : "text-site-muted"}`}>/ year</span>
      </div>
      <ul className="m-0 mt-5 flex flex-grow list-none flex-col gap-3 p-0 text-[15px]">
        <li className="font-semibold">{plan.roomLimit ? `Up to ${plan.roomLimit} rooms or shops` : "Unlimited rooms and shops"}</li>
        {INCLUDED.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <SiteButton to="/register" variant={dark ? "gold" : "outline"} className="mt-7 min-h-[50px] w-full">
        Get started
      </SiteButton>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get("/plans")
      .then((res) => setPlans(res.data))
      .catch(() => setFailed(true));
  }, []);

  // Highlight the middle plan when there are three.
  const featuredIndex = plans && plans.length === 3 ? 1 : -1;

  return (
    <SitePage>
      <section className="mx-auto max-w-[1200px] px-6 pb-2 pt-16 text-center">
        <Eyebrow>PRICING</Eyebrow>
        <h1 className="mx-auto mb-0 mt-2.5 max-w-[720px] font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.08]">
          One flat price. No surprises.
        </h1>
        <p className="mx-auto mb-0 mt-[18px] max-w-[560px] text-[19px] leading-relaxed text-site-muted">
          One yearly fee based on how many rooms and shops you manage. No charge on rent payments.
        </p>
      </section>

      {/* One centred column until all three fit side by side — never 2 + 1. */}
      <section className="mx-auto grid max-w-[480px] grid-cols-1 items-stretch gap-5 px-6 pt-12 lg:max-w-[1100px] lg:grid-cols-3">
        {!plans && !failed &&
          [0, 1, 2].map((i) => <div key={i} className="h-[480px] animate-pulse rounded-[22px] bg-white motion-reduce:animate-none" aria-hidden="true" />)}
        {failed && (
          <p className="text-center text-site-muted lg:col-span-3">
            Prices couldn't load right now. Please refresh, or get started and we'll show your plan options when you sign up.
          </p>
        )}
        {plans?.map((p, i) => (
          <PlanCard key={p.id} plan={p} featured={i === featuredIndex} />
        ))}
      </section>

      <section className="mx-auto max-w-[760px] px-6 pt-[72px]">
        <h2 className="m-0 mb-2 font-display text-[32px] font-bold">Questions</h2>
        <dl className="m-0">
          {FAQS.map((f, i) => (
            <div key={f.q} className={`border-t border-site-border py-5 ${i === FAQS.length - 1 ? "border-b" : ""}`}>
              <dt className="text-[17px] font-bold">{f.q}</dt>
              <dd className="m-0 mt-1.5 leading-relaxed text-site-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CtaBand title="Ready to get started?">
        <SiteButton to="/register" variant="gold">Get started</SiteButton>
      </CtaBand>
    </SitePage>
  );
}
