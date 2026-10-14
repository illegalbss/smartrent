import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaLock, FaCheckCircle } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { api } from "../api/client";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
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
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthLayout tagline="You're all set — log in with your new password.">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <FaCheckCircle size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-ink-900">Password updated</h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">Your password has been changed successfully.</p>
          <Link
            to="/login"
            className="mt-8 w-full rounded-xl bg-brand-500 py-3.5 text-center text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout tagline="Choose a new password to get back to managing your rentals.">
      <h1 className="text-2xl font-extrabold text-ink-900">Set a New Password</h1>
      <p className="mt-1.5 text-sm text-ink-500">Enter and confirm your new password below.</p>

      {!token && (
        <div className="mt-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700">
          No reset token found in this link. Make sure you used the exact link from your email.
        </div>
      )}

      <form className="mt-6" onSubmit={handleSubmit}>
        <FormField
          label="New Password"
          name="password"
          icon={FaLock}
          type="password"
          placeholder="Create a new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormField
          label="Confirm Password"
          name="confirm"
          icon={FaLock}
          type="password"
          placeholder="Confirm your new password"
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
          {submitting ? "Saving…" : "Update Password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Link expired?{" "}
        <Link to="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700">
          Request a new one
        </Link>
      </p>
    </AuthLayout>
  );
}
