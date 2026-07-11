import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Logo from "./Logo";
import loginBuilding from "../assets/login-building.jpg";

export default function AuthLayout({ children, tagline }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Logo />
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-600"
            >
              <FaArrowLeft size={12} /> Back to Home
            </Link>
          </div>
          <div className="mt-10">{children}</div>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-end justify-center lg:flex">
        <img src={loginBuilding} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="relative z-10 max-w-md px-10 pb-16 text-center">
          <h2 className="text-2xl font-bold text-white">Manage Your Rental Property Easily</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            {tagline || "Connect, pay rent, and track everything in one secure place."}
          </p>
        </div>
      </div>
    </div>
  );
}
