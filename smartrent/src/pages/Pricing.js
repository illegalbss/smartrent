import { SitePage, Eyebrow, SiteButton, CtaBand } from "../components/site/SiteUi";

const PLANS = [
  {
    name: "Starter",
    tagline: "For one small property",
    price: "₦8,000",
    features: ["Up to 10 units", "Rent records and receipts", "Tenant list and reminders", "Private documents"],
  },
  {
    name: "Growth",
    tagline: "For a growing portfolio",
    price: "₦18,000",
    features: ["Up to 40 units", "Everything in Starter", "Accountant login", "Reports and downloads", "History log of every change"],
    featured: true,
  },
  {
    name: "Pro",
    tagline: "For estates and plazas",
    price: "₦35,000",
    features: ["More than 40 units", "Everything in Growth", "Several team logins", "Priority support"],
  },
];

const FAQS = [
  {
    q: "Can my tenants pay through RentaFlow?",
    a: "Not yet. You record payments when you receive them, whether cash, transfer or POS. Online payments may come later.",
  },
  {
    q: "Who can see my tenants' details?",
    a: "Only you and the team members you invite. Other landlords can never see your data.",
  },
];

function PlanCard({ plan }) {
  const dark = plan.featured;
  return (
    <div
      className={`relative flex flex-col rounded-[22px] p-8 transition-[transform,box-shadow] duration-[250ms] hover:shadow-[0_12px_28px_rgba(60,10,10,0.14)] motion-safe:hover:-translate-y-1 ${
        dark ? "bg-brand-700 text-white" : "bg-white"
      }`}
    >
      {dark && (
        <div className="absolute -top-3.5 left-8 rounded-xl bg-gold-500 px-3 py-1 text-xs font-bold text-site-text">Most popular</div>
      )}
      <h2 className="m-0 text-xl font-bold">{plan.name}</h2>
      <div className={`mt-1 text-[15px] ${dark ? "text-[#E8DADA]" : "text-site-muted"}`}>{plan.tagline}</div>
      <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-display text-[clamp(36px,10vw,44px)] font-bold">{plan.price}</span>
        <span className={`whitespace-nowrap ${dark ? "text-[#E8DADA]" : "text-site-muted"}`}>/ month</span>
      </div>
      <ul className="m-0 mt-5 flex flex-grow list-none flex-col gap-3 p-0 text-[15px]">
        {plan.features.map((f) => (
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
  return (
    <SitePage>
      <section className="mx-auto max-w-[1200px] px-6 pb-2 pt-16 text-center">
        <Eyebrow>PRICING</Eyebrow>
        <h1 className="mx-auto mb-0 mt-2.5 max-w-[720px] font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.08]">
          One flat price. No surprises.
        </h1>
        <p className="mx-auto mb-0 mt-[18px] max-w-[560px] text-[19px] leading-relaxed text-site-muted">
          Pay yearly and get 10% off.
        </p>
      </section>

      {/* One centred column until all three fit side by side — never 2 + 1. */}
      <section className="mx-auto grid max-w-[480px] grid-cols-1 items-stretch gap-5 px-6 pt-12 lg:max-w-[1100px] lg:grid-cols-3">
        {PLANS.map((p) => (
          <PlanCard key={p.name} plan={p} />
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
