import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser, FaBuilding, FaUserTie } from "react-icons/fa";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import RoleSelector from "../components/RoleSelector";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "landlord", label: "Landlord", icon: FaBuilding },
  { value: "secretary", label: "Secretary", icon: FaUserTie },
  { value: "tenant", label: "Tenant", icon: FaUser },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("landlord");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await login(email.trim(), password, role);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const homePath = result.user.role === "tenant" ? "/dashboard/tenant" : "/dashboard/staff";
    const requestedFrom = location.state?.from;
    const redirectTo = requestedFrom && requestedFrom.startsWith(homePath) ? requestedFrom : homePath;
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthLayout tagline="Manage properties, track payments, and stay connected — all in one place.">
      <h1 className="text-2xl font-extrabold text-ink-900">Welcome Back!</h1>
      <p className="mt-1.5 text-sm text-ink-500">Login to your account</p>

      <form className="mt-6" onSubmit={handleSubmit}>
        <RoleSelector roles={ROLES} value={role} onChange={setRole} label="Login as" />

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

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Landlord without an account?{" "}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Register here
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-ink-400">
        Secretaries and Tenants: use the invite link your landlord sent you to set up your account.
      </p>
    </AuthLayout>
  );
}
