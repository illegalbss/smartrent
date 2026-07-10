import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 900);
  }

  if (sent) {
    return (
      <AuthLayout tagline="Check your inbox for a link to reset your password.">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <FaCheckCircle size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-ink-900">Check your email</h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
            If an account exists for <span className="font-semibold text-ink-700">{email}</span>, we've sent a
            password reset link to it.
          </p>
          <Link
            to="/login"
            className="mt-8 w-full rounded-xl bg-brand-500 py-3.5 text-center text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
          >
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout tagline="Reset your password in a few seconds and get back to managing your rentals.">
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-600">
        <FaArrowLeft size={12} /> Back to login
      </Link>
      <h1 className="mt-5 text-2xl font-extrabold text-ink-900">Forgot Password?</h1>
      <p className="mt-1.5 text-sm text-ink-500">
        No worries! Enter your email and we'll send you reset instructions.
      </p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <FormField
          label="Email Address"
          name="email"
          icon={FaEnvelope}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send Reset Link"}
        </button>
      </form>
    </AuthLayout>
  );
}
