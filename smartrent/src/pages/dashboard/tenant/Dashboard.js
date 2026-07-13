import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaArrowRight,
  FaCheckCircle,
  FaCreditCard,
  FaUniversity,
  FaMobileAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Card, StatCard, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import { TENANT_NAV } from "../../../config/navigation";
import { api } from "../../../api/client";
import { paymentsApi } from "../../../api/payments";
import { payWithPaystack } from "../../../utils/paystack";
import { useAuth } from "../../../context/AuthContext";

const PAYMENT_METHODS = [
  { value: "card", label: "Pay with Card", sub: "Visa, Mastercard, Verve", icon: FaCreditCard, channels: ["card"] },
  { value: "bank_transfer", label: "Bank Transfer", sub: "Transfer directly to a Paystack account", icon: FaUniversity, channels: ["bank_transfer"] },
  { value: "ussd", label: "USSD", sub: "Pay using your bank's USSD code", icon: FaMobileAlt, channels: ["ussd"] },
];

const FREQUENCY_LABEL = { MONTHLY: "month", QUARTERLY: "quarter", YEARLY: "year" };

export default function TenantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const [showMethodModal, setShowMethodModal] = useState(false);

  function loadProfile() {
    api
      .get("/tenant/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(loadProfile, []);

  async function handlePayRent(channels) {
    setShowMethodModal(false);
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
        channels,
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
              {profile.paymentStatus && (profile.paymentStatus.isOverdue || (profile.paymentStatus.daysUntilDue !== null && profile.paymentStatus.daysUntilDue <= 14)) && (
                <div
                  className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm font-medium ${
                    profile.paymentStatus.isOverdue ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <FaExclamationTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    {profile.paymentStatus.isOverdue ? (
                      <>
                        Your rent was due on {formatDate(profile.paymentStatus.nextDueDate)} —{" "}
                        {Math.abs(profile.paymentStatus.daysUntilDue)} day(s) overdue.
                      </>
                    ) : profile.paymentStatus.daysUntilDue === 0 ? (
                      <>Your rent is due today ({formatDate(profile.paymentStatus.nextDueDate)}).</>
                    ) : (
                      <>
                        Your rent is due in {profile.paymentStatus.daysUntilDue} day(s), on{" "}
                        {formatDate(profile.paymentStatus.nextDueDate)}.
                      </>
                    )}{" "}
                    {profile.paymentStatus.outstanding > 0 && (
                      <>Outstanding balance: {formatNaira(profile.paymentStatus.outstanding)}.</>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Property" value={profile.room.property.name} icon={FaHome} sub={profile.room.property.address} />
                <StatCard label="Room" value={profile.room.roomNumber} icon={FaHome} />
                <StatCard label="Rent" value={formatNaira(profile.room.rentAmount)} icon={FaMoneyBillWave} sub={`per ${FREQUENCY_LABEL[profile.room.rentFrequency || "YEARLY"]}`} />
                <StatCard
                  label="Outstanding"
                  value={formatNaira(profile.paymentStatus?.outstanding || 0)}
                  icon={FaExclamationTriangle}
                  sub={profile.paymentStatus?.nextDueDate ? `Next due ${formatDate(profile.paymentStatus.nextDueDate)}` : "No payments yet"}
                />
              </div>

              <button
                onClick={() => setShowMethodModal(true)}
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

      <Modal open={showMethodModal} title="Select Payment Method" onClose={() => setShowMethodModal(false)}>
        <div className="space-y-2.5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => handlePayRent(m.channels)}
              className="flex w-full items-center gap-3.5 rounded-xl border border-ink-200 px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <m.icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink-900">{m.label}</span>
                <span className="block text-xs text-ink-400">{m.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-400">
          All methods are processed securely through Paystack — you'll complete payment in the window that opens next.
        </p>
      </Modal>
    </DashboardShell>
  );
}
