import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaMoneyBillWave,
  FaUsers,
  FaChartLine,
  FaBell,
  FaShieldAlt,
  FaStar,
  FaArrowRight,
} from "react-icons/fa";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";
import heroBuilding from "../assets/hero-building.jpg";

const FEATURES = [
  {
    icon: FaBuilding,
    title: "Property & Room Management",
    body: "Add, edit, or delete properties and rooms at any time — organized and personal properties, tracked separately.",
  },
  {
    icon: FaMoneyBillWave,
    title: "Payment Tracking",
    body: "Record rent payments in Naira, with full edit and delete history for correcting entry mistakes.",
  },
  {
    icon: FaUsers,
    title: "Three Account Types",
    body: "Landlord, Secretary/Accountant, and Tenant accounts each see exactly what they need — nothing more.",
  },
  {
    icon: FaChartLine,
    title: "Occupancy Dashboard",
    body: "See occupancy across every property at a glance, grouped by Organization vs. Personal ownership.",
  },
  {
    icon: FaBell,
    title: "Complaints & Messages",
    body: "Tenants raise issues directly to their landlord, who responds and tracks resolution status.",
  },
  {
    icon: FaShieldAlt,
    title: "Secure Document Management",
    body: "Referee forms, ID, and tenancy agreements — stored per tenant, viewable only by Secretary and Landlord.",
  },
];

const STATS = [
  { value: "3", label: "Account Types" },
  { value: "₦", label: "Naira-Native" },
  { value: "100%", label: "Audit-Logged Payments" },
  { value: "24/7", label: "Access Anywhere" },
];

const TESTIMONIALS = [
  {
    quote:
      "I manage properties I own personally and ones owned by the family estate — finally I can see both at a glance.",
    name: "Michael Adebayo",
    role: "Landlord, 8 units",
  },
  {
    quote:
      "Registering a new tenant used to mean a stack of paper. Now it's one form and the agreement generates itself.",
    name: "Grace Okonkwo",
    role: "Secretary/Accountant",
  },
  {
    quote:
      "I can see exactly what I've paid and when my lease is up for renewal, without calling the office.",
    name: "David Chukwu",
    role: "Tenant",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white" id="top">
      <PublicNavbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
          <div>
            <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
              Rental Management, Simplified
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
              Manage Properties, Tenants &amp; Rent Records Easily
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-500">
              RentaFlow helps landlords, secretaries, and tenants/shop owners track properties, units, payments,
              and tenancy documents — all in one secure, easy-to-use place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-600"
              >
                Get Started <FaArrowRight size={13} />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-ink-200 bg-white px-6 py-3.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-600"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-soft">
            <img
              src={heroBuilding}
              alt="A modern rental property managed with RentaFlow"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-900">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-ink-900">Everything you need, in one place</h2>
          <p className="mt-3 text-ink-500">
            A complete toolkit for landlords and tenants to manage rentals effortlessly.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-ink-100 bg-white p-7 shadow-card transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <f.icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-ink-900">Loved by landlords and tenants</h2>
            <p className="mt-3 text-ink-500">Real feedback from people using RentaFlow every day.</p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white p-7 shadow-card">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar key={i} size={13} />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink-900">{t.name}</div>
                    <div className="text-xs text-ink-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-8 py-14 text-center shadow-soft md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Ready to simplify your rental management?
            </h2>
            <p className="mt-2 max-w-md text-sm text-brand-50">
              Create your free RentaFlow account today — no credit card required.
            </p>
          </div>
          <Link
            to="/register"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-card transition hover:bg-brand-50"
          >
            Get Started <FaArrowRight size={13} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
