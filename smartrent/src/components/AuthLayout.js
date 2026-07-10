import Logo from "./Logo";
import BuildingIllustration from "./BuildingIllustration";

export default function AuthLayout({ children, tagline }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-md">
          <Logo />
          <div className="mt-10">{children}</div>
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 lg:flex">
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_60%,white,transparent_30%)]" />
        </div>
        <div className="relative z-10 flex flex-col items-center px-10 text-center">
          <BuildingIllustration className="w-80" />
          <h2 className="mt-8 text-2xl font-bold text-white">Manage Your Rental Property Easily</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-50">
            {tagline || "Connect, pay rent, and track everything in one secure place."}
          </p>
        </div>
      </div>
    </div>
  );
}
