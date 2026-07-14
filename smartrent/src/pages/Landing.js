import { Link } from "react-router-dom";
import {
  FaBuilding,
  FaMoneyBillWave,
  FaUsers,
  FaChartLine,
  FaBell,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";
import PublicNavbar from "../components/PublicNavbar";
import Footer from "../components/Footer";
import heroBuilding from "../assets/hero-building.jpg";
import galleryTownhouse from "../assets/gallery-townhouse.jpg";
import galleryConstruction from "../assets/gallery-construction.jpg";
import loginBuilding from "../assets/login-building.jpg";

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
    title: "Tenants & Shop Owners",
    body: "Residential tenants and commercial shop owners are tracked with the fields that matter to each — next of kin vs. business/CAC details.",
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

const GALLERY = [
  { src: galleryTownhouse, alt: "A modern multi-unit townhouse development", className: "sm:row-span-2" },
  { src: loginBuilding, alt: "A residential apartment building" },
  { src: galleryConstruction, alt: "A high-rise residential building" },
];

const ABOUT_POINTS = [
  {
    icon: FaUsers,
    title: "Four roles, one system",
    body: "Landlord, Secretary/Accountant, Tenant/Shop Owner, and a platform Super Admin — each sees exactly what's relevant to them, nothing more.",
  },
  {
    icon: FaMoneyBillWave,
    title: "Manual or online payments",
    body: "Record cash, transfer, or POS payments by hand, or let tenants pay online through Paystack — either way, one payment history.",
  },
  {
    icon: FaShieldAlt,
    title: "Documents stay protected",
    body: "Tenancy agreements, IDs, and referee forms are visible only to Secretary and Landlord accounts — never exposed to a tenant login, even via a direct link.",
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

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-ink-900">Properties managed on RentaFlow</h2>
          <p className="mt-3 text-ink-500">From single townhouses to multi-unit apartment buildings.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:grid-rows-2">
          {GALLERY.map((g) => (
            <div key={g.src} className={`overflow-hidden rounded-2xl shadow-card ${g.className || ""}`}>
              <img src={g.src} alt={g.alt} className="h-full max-h-96 w-full object-cover sm:max-h-none" />
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="bg-ink-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-ink-900">Built for how Nigerian rentals actually work</h2>
            <p className="mt-3 text-ink-500">
              One place for landlords, secretaries, tenants, and shop owners — instead of spreadsheets, paper
              agreements, and WhatsApp reminders.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {ABOUT_POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white p-7 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <p.icon size={18} />
                </div>
                <h3 className="mt-4 text-base font-bold text-ink-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.body}</p>
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
