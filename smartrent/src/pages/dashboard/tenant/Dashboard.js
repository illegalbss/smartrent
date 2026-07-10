import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaCalendarAlt, FaMoneyBillWave, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, StatCard, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import { TENANT_NAV } from "../../../config/navigation";
import { api } from "../../../api/client";
import { paymentsApi } from "../../../api/payments";
import { payWithPaystack } from "../../../utils/paystack";
import { useAuth } from "../../../context/AuthContext";

export default function TenantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState("");

  function loadProfile() {
    api
      .get("/tenant/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(loadProfile, []);

  async function handlePayRent() {
    setError("");
    setPayMessage("");
    setPaying(true);
    try {
      const { data } = await paymentsApi.paystackInitialize();
      await payWithPaystack({
        publicKey: data.publicKey,
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        onSuccess: async (reference) => {
          try {
            await paymentsApi.paystackVerify(reference);
            setPayMessage("Payment confirmed — thank you! Your payment history has been updated.");
            loadProfile();
          } catch (err) {
            setError(err.message);
          } finally {
            setPaying(false);
          }
        },
        onClose: () => setPaying(false),
      });
    } catch (err) {
      setError(err.message);
      setPaying(false);
    }
  }

  return (
    <DashboardShell navItems={TENANT_NAV} title={`Welcome, ${user.fullName?.split(" ")[0]}`} subtitle="Your tenancy at a glance">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
      {payMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <FaCheckCircle size={13} /> {payMessage}
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          {!profile.room && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              You haven't been assigned to a room yet. Contact your landlord or secretary.
            </div>
          )}

          {profile.room && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Property" value={profile.room.property.name} icon={FaHome} sub={profile.room.property.address} />
                <StatCard label="Room" value={profile.room.roomNumber} icon={FaHome} />
                <StatCard label="Rent" value={formatNaira(profile.room.rentAmount)} icon={FaMoneyBillWave} sub="per annum" />
              </div>

              <button
                onClick={handlePayRent}
                disabled={paying}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
              >
                <FaMoneyBillWave size={14} /> {paying ? "Opening secure payment…" : `Pay Rent Online — ${formatNaira(profile.room.rentAmount)}`}
              </button>

              <Card title="Lease Dates">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-400">
                      <FaCalendarAlt size={11} /> Date Commenced
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(profile.dateCommencement)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-400">
                      <FaCalendarAlt size={11} /> Date of Expiration
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(profile.dateExpiration)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-400">
                      <FaCalendarAlt size={11} /> Renewal Date
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink-800">{formatDate(profile.dateRenewal)}</div>
                  </div>
                </div>
              </Card>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/tenant/payments" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600">
              View Payment History <FaArrowRight size={12} />
            </Link>
            <Link to="/dashboard/tenant/complaints" className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-600">
              Raise a Complaint <FaArrowRight size={12} />
            </Link>
          </div>

          <p className="text-xs text-ink-400">
            Tenancy documents (agreement, ID, referee form) are managed by your Landlord/Secretary and are not viewable from your account.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
