import Logo from "./Logo";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-ink-100 bg-ink-900 text-ink-200">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo light iconLinkTo="/admin/login" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
            RentaFlow helps landlords, secretaries, and tenants/shop owners track properties, payments, and
            tenancy documents — all in one place.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Product</h4>
          <ul className="space-y-2.5 text-sm text-ink-400">
            <li><a href="/#features" className="hover:text-brand-400">Features</a></li>
            <li><a href="/#about" className="hover:text-brand-400">About</a></li>
            <li><a href="/login" className="hover:text-brand-400">Login</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Company</h4>
          <ul className="space-y-2.5 text-sm text-ink-400">
            <li><a href="/#about" className="hover:text-brand-400">About Us</a></li>
            <li><a href="/register" className="hover:text-brand-400">Get Started</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} RentaFlow. All rights reserved.
      </div>
    </footer>
  );
}
