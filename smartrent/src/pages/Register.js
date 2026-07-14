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
      <h1 className="text-2xl font-extrabold text-ink-900">Create Your Landlord Account</h1>
      <p className="mt-1.5 text-sm text-ink-500">Join RentaFlow today</p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-700">Registering as</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setForm((f) => ({ ...f, accountType: t.value }))}
                className={`rounded-xl border px-3 py-2.5 text-left transition ${
                  form.accountType === t.value ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-brand-300"
                }`}
              >
                <span className={`block text-sm font-bold ${form.accountType === t.value ? "text-brand-700" : "text-ink-800"}`}>{t.label}</span>
                <span className="block text-xs text-ink-400">{t.sub}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-400">Used later when you set up payouts — you can change this anytime.</p>
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
          className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Login here
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-ink-400">
        Secretaries and Tenants don't register here — a landlord sends an invite link to set up those accounts.
      </p>
    </AuthLayout>
  );
}
