import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

export default function AcceptInvite() {
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const role = searchParams.get("role") === "secretary" ? "secretary" : "tenant";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This invite link is missing its token. Ask your landlord to resend it.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await acceptInvite(role, { token, password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(role === "tenant" ? "/dashboard/tenant" : "/dashboard/staff", { replace: true });
  }

  return (
    <AuthLayout tagline="Set up your account to manage tenancies, payments, and documents online.">
      <h1 className="text-2xl font-extrabold text-ink-900">Welcome</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Set a password to activate your {role === "secretary" ? "secretary" : "tenant"} account.
      </p>

      {!token && (
        <div className="mt-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700">
          No invite token found in this link. Make sure you used the exact link your landlord sent you.
        </div>
      )}

      <form className="mt-6" onSubmit={handleSubmit}>
        <FormField
          label="Password"
          name="password"
          icon={FaLock}
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormField
          label="Confirm Password"
          name="confirm"
          icon={FaLock}
          type="password"
          placeholder="Confirm your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Activating…" : "Activate Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already activated your account?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Login here
        </Link>
      </p>
    </AuthLayout>
  );
}
