import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCrown, FaEnvelope, FaLock } from "react-icons/fa";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in as anyone? Send them back to their own dashboard;
  // otherwise fall back to the public homepage.
  const backTo =
    user?.role === "superadmin"
      ? "/admin/dashboard"
      : user?.role === "tenant"
        ? "/dashboard/tenant"
        : user
          ? "/dashboard/staff"
          : "/";
  const backLabel = user ? "Back to dashboard" : "Back to homepage";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email.trim(), password, "superadmin");
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/admin/dashboard", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <FaCrown size={17} />
          </span>
          <div>
            <div className="text-base font-extrabold text-ink-900">RentaFlow Admin</div>
            <div className="text-xs text-ink-400">Platform owner access only</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <FormField
            label="Email Address"
            name="email"
            icon={FaEnvelope}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            label="Password"
            name="password"
            icon={FaLock}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-violet-700 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <Link
          to={backTo}
          className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          <FaArrowLeft size={12} />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
