import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

const ACCOUNT_TYPES = [
  { value: "INDIVIDUAL", label: "Individual", sub: "I own/manage properties personally" },
  { value: "ORGANIZATION", label: "Organization", sub: "I'm registering on behalf of a company/estate" },
];

export default function Register() {
  const { registerLandlord } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirm: "", accountType: "INDIVIDUAL" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    const result = await registerLandlord({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      accountType: form.accountType,
    });
    setSubmitting(false);

    if (!result.ok) {
      setErrors({ email: result.error });
      return;
    }
    navigate("/dashboard/staff", { replace: true });
  }

  return (
    <AuthLayout tagline="Create a landlord account to manage properties and track rent payments.">
      <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-gold-700">For landlords</p>
      <h1 className="m-0 mt-1.5 font-display text-[30px] font-bold leading-tight text-site-text">Create your account</h1>
      <p className="m-0 mt-1.5 text-sm text-site-muted">It takes about a minute. You can add your properties straight after.</p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="mb-4">
          <span className="mb-1.5 block text-sm font-semibold text-ink-700">Registering as</span>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, accountType: t.value }))}
                aria-pressed={form.accountType === t.value}
                className={`min-h-[64px] rounded-xl border-[1.5px] px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  form.accountType === t.value ? "border-brand-700 bg-[#FBF3E3]" : "border-site-border hover:border-brand-300"
                }`}
              >
                <span className={`block text-sm font-bold ${form.accountType === t.value ? "text-brand-700" : "text-ink-800"}`}>{t.label}</span>
                <span className="block text-xs text-site-muted">{t.sub}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-site-muted">You can change this later.</p>
        </div>

        <FormField
          label="Full Name"
          name="fullName"
          icon={FaUser}
          placeholder="Enter your full name"
          value={form.fullName}
          onChange={setField("fullName")}
          error={errors.fullName}
          required
        />
        <FormField
          label="Email Address"
          name="email"
          icon={FaEnvelope}
          type="email"
          placeholder="Enter your email"
          value={form.email}
          onChange={setField("email")}
          error={errors.email}
          required
        />
        <FormField
          label="Phone Number"
          name="phone"
          icon={FaPhone}
          type="tel"
          placeholder="Enter your phone number"
          value={form.phone}
          onChange={setField("phone")}
          error={errors.phone}
        />
        <FormField
          label="Password"
          name="password"
          icon={FaLock}
          type="password"
          placeholder="Create a password"
          value={form.password}
          onChange={setField("password")}
          error={errors.password}
          required
        />
        <FormField
          label="Confirm Password"
          name="confirm"
          icon={FaLock}
          type="password"
          placeholder="Confirm your password"
          value={form.confirm}
          onChange={setField("confirm")}
          error={errors.confirm}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 min-h-[50px] w-full rounded-xl bg-brand-700 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(92,16,16,0.25)] transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-60 motion-safe:enabled:hover:-translate-y-0.5"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-site-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-3 rounded-xl bg-[#FBF3E3] px-3 py-2.5 text-center text-xs leading-relaxed text-[#5A4100]">
        Secretaries and Tenants don't register here — a landlord sends an invite link to set up those accounts.
      </p>
    </AuthLayout>
  );
}
