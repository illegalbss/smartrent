import { SitePage, Eyebrow, SiteButton, CtaBand, StatusChip } from "../components/site/SiteUi";

const h2 = "m-0 mt-2 font-display text-[32px] font-bold leading-[1.15]";
const body = "m-0 mt-3.5 text-[17px] leading-[1.65] text-site-muted";
const panel = "min-w-0 flex-[1_1_380px] rounded-[20px] bg-white p-7 shadow-[0_16px_40px_rgba(60,10,10,0.1)]";

function Row({ label, children, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-[#EEE6D8]"}`}>
      <span className="text-site-muted">{label}</span>
      {children}
    </div>
  );
}

export default function Features() {
  return (
    <SitePage>
      <section className="mx-auto max-w-[1200px] px-6 pb-4 pt-16">
        <Eyebrow>FEATURES</Eyebrow>
        <h1 className="m-0 mt-2.5 max-w-[760px] font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.08]">
          Everything a landlord needs, nothing they don't.
        </h1>
        <p className="m-0 mt-[18px] max-w-[620px] text-[19px] leading-relaxed text-site-muted">
          Built around how rent really works here: manual payments, part-payments, flats and shops.
        </p>
      </section>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-[72px] px-6 pt-10">
        {/* Rent records */}
        <section className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[1_1_380px]">
            <Eyebrow className="text-[13px]">RENT RECORDS</Eyebrow>
            <h2 className={h2}>Record a payment in three taps.</h2>
            <p className={body}>
              Pick the tenant, enter the amount, confirm. A checkmark and a receipt number appear straight away. Part-payments
              are tracked, and mistakes are easy to fix: every edit or deletion is kept in the history log.
            </p>
          </div>
          <div className={panel} role="img" aria-label="Example payment confirmation with sample figures">
            <Row label="Tenant"><b>Chinedu Eze</b></Row>
            <Row label="Period"><b>Nov 2026 rent</b></Row>
            <Row label="Amount" last><b className="font-display text-[26px]">₦150,000</b></Row>
            <div className="rounded-xl bg-brand-700 p-3.5 text-center font-bold text-white">Confirm and save</div>
          </div>
        </section>

        {/* Documents — panel first on wide screens, text first on phones */}
        <section className="flex flex-wrap-reverse items-center gap-10">
          <div className={panel} role="img" aria-label="Example private documents list">
            {[
              { file: "Agreement.pdf", unit: "Flat 2B" },
              { file: "Tenant ID.jpg", unit: "Flat 2B" },
            ].map((d, i) => (
              <div key={d.file} className={`flex items-center gap-3 py-3 ${i === 0 ? "border-b border-[#EEE6D8]" : ""}`}>
                <div className="flex-grow">
                  <b>{d.file}</b>
                  <div className="text-[13px] text-site-muted">{d.unit}</div>
                </div>
                <StatusChip status="Private" />
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-[1_1_380px]">
            <Eyebrow className="text-[13px]">DOCUMENTS</Eyebrow>
            <h2 className={h2}>Agreements and IDs, kept private.</h2>
            <p className={body}>
              Files are stored privately and only open after we check who is asking. Only you and your accountant can see them.
              Tenants and shop owners never can.
            </p>
          </div>
        </section>

        {/* Team and tenants */}
        <section className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[1_1_380px]">
            <Eyebrow className="text-[13px]">YOUR TEAM AND TENANTS</Eyebrow>
            <h2 className={h2}>The right access for each person.</h2>
            <p className={body}>
              Give your secretary or accountant a login to record payments. Tenants and shop owners get a simple view of their
              own balance and receipts.
            </p>
          </div>
          <div className="grid min-w-0 flex-[1_1_380px] grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
            {[
              { role: "Landlord", access: "Everything" },
              { role: "Accountant", access: "Payments and reports" },
              { role: "Tenant", access: "Own balance only" },
            ].map((r) => (
              <div key={r.role} className="rounded-2xl bg-white p-5">
                <b>{r.role}</b>
                <div className="mt-1.5 text-sm text-site-muted">{r.access}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CtaBand title="Ready to get started?">
        <SiteButton to="/register" variant="gold">Get started</SiteButton>
        <SiteButton to="/login" variant="outlineLight">Log in</SiteButton>
      </CtaBand>
    </SitePage>
  );
}
