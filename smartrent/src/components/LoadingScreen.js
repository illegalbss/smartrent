import Logo from "./Logo";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white">
      <Logo linkTo="#" />
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-100 border-t-brand-500" />
    </div>
  );
}
