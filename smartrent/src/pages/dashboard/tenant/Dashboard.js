import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCheckCircle, FaCreditCard, FaUniversity, FaMobileAlt, FaEnvelope } from "react-icons/fa";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import { Badge, formatDate, formatNaira } from "../../../components/dashboard/UiKit";
import Modal from "../../../components/Modal";
import { TENANT_NAV } from "../../../config/navigation";
import { api } from "../../../api/client";
import { paymentsApi } from "../../../api/payments";
import { complaintsApi } from "../../../api/complaints";
import { payWithPaystack } from "../../../utils/paystack";
import { useAuth } from "../../../context/AuthContext";

const PAYMENT_METHODS = [
  { value: "card", label: "Pay with Card", sub: "Visa, Mastercard, Verve", icon: FaCreditCard, channels: ["card"] },
  { value: "bank_transfer", label: "Bank Transfer", sub: "Transfer directly to a Paystack account", icon: FaUniversity, channels: ["bank_transfer"] },
  { value: "ussd", label: "USSD", sub: "Pay using your bank's USSD code", icon: FaMobileAlt, channels: ["ussd"] },
];

const FREQUENCY_LABEL = { MONTHLY: "month", QUARTERLY: "quarter", YEARLY: "year" };
const PAY_STATUS = { PAID: { tone: "green", label: "Paid" }, PARTIAL: { tone: "amber", label: "Part-paid" }, OWING: { tone: "red", label: "Owing" } };
const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";
const panel = "rounded-[18px] border border-[#EFE6D6] bg-white p-5";

function BalanceCard({ ps, rentFrequency }) {
  const outstanding = Number(ps?.outstanding || 0);
  let chip = { tone: "green", label: "Up to date" };
  let line = ps?.nextDueDate ? `Next rent due ${formatDate(ps.nextDueDate)}` : "No rent due yet";
  if (ps?.isOverdue) {
    chip = { tone: "red", label: "Overdue" };
    line = `Was due ${formatDate(ps.nextDueDate)} · ${Math.abs(ps.daysUntilDue)} day${Math.abs(ps.daysUntilDue) === 1 ? "" : "s"} ago`;
  } else if (ps?.daysUntilDue === 0) {
    chip = { tone: "amber", label: "Due today" };
    line = `Due today, ${formatDate(ps.nextDueDate)}`;
  } else if (ps?.daysUntilDue !== null && ps?.daysUntilDue <= 14) {
    chip = { tone: "amber", label: "Due soon" };
    line = `Due in ${ps.daysUntilDue} day${ps.daysUntilDue === 1 ? "" : "s"}, on ${formatDate(ps.nextDueDate)}`;
  }
  return (
    <div className="relative mx-3 -mt-12 rounded-[18px] bg-white p-5 shadow-[0_6px_20px_rgba(60,10,10,0.14)] sm:mx-4">
      <div className="text-[13px] text-site-muted">{outstanding > 0 ? "Balance due" : "Balance"}</div>
      <div className="mt-0.5 font-display text-[38px] font-bold leading-tight">{formatNaira(outstanding)}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={chip.tone}>{chip.label}</Badge>
        <span className="text-[13px] text-site-muted">{line}</span>
      </div>
      <div className="mt-1 text-xs text-site-muted">Rent is charged per {FREQUENCY_LABEL[rentFrequency || "YEARLY"]}.</div>
    </div>
  );
}

// Tells the landlord through the app's own messages (the Complaints inbox),
// so a tenant who paid by transfer or cash can prompt them to record it.
function TellLandlord({ amount }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function send() {
    setState("sending");
    setError("");
    try {
      await complaintsApi.create(
        `I have paid my rent${amount > 0 ? ` (${formatNaira(amount)})` : ""} on ${formatDate(new Date())}. Please confirm and record it. Thank you.`
      );
      setState("sent");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="m-0 mt-3 flex items-center gap-2 rounded-xl bg-[#E3F2E7] px-4 py-3 text-sm font-medium text-[#1F6B3A]">
        <FaCheckCircle size={14} aria-hidden="true" /> Your landlord has been told. They will record it and your receipt will appear below.
      </p>
    );
  }
  return (
    <>
      <button
        onClick={send}
        disabled={state === "sending"}
        className={`mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl border-[1.5px] border-brand-700 bg-white px-4 font-bold text-brand-700 transition disabled:opacity-60 motion-safe:enabled:hover:-translate-y-0.5 ${ring}`}
      >
        {state === "sending" ? "Sending…" : "I have paid, tell my landlord"}
      </button>
      {state === "error" && (
        <p role="alert" className="m-0 mt-2 text-sm text-[#8A1C1C]">
          Couldn't send: {error}
        </p>
      )}
    </>
  );
}

export default function TenantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payMessage, setPayMessage] = useState("");
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [enableRecurring, setEnableRecurring] = useState(false);

  function loadProfile() {
    api
      .get("/tenant/profile")
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.message));
    api
      .get("/tenant/payments")
      .then((res) => setPayments(res.data))
      .catch(() => setPayments([]));
  }

  useEffect(loadProfile, []);

  async function handlePayRent(channels) {
    setShowMethodModal(false);
    setError("");
    setPayMessage("");
    setPaying(true);
    try {
      const { data } = await paymentsApi.paystackInitialize(enableRecurring);
      await payWithPaystack({
        publicKey: data.publicKey,
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        channels,
        subaccount: data.subaccount,
        plan: data.plan,
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

  const firstName = user.fullName?.split(" ")[0];
  const unit = profile?.room ? `${profile.room.property.name} · ${profile.room.roomNumber}` : null;

  return (
    <DashboardShell navItems={TENANT_NAV} title={`Hello, ${firstName}`} subtitle="Your tenancy at a glance">
      {error && <div className="mb-4 rounded-xl bg-[#FBE6E6] px-4 py-3 text-sm font-medium text-[#8A1C1C]">{error}</div>}
      {!user.email && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl bg-[#FFF1CC] px-4 py-3 text-sm text-[#6B4E00] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <FaEnvelope size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">Add an email to your account.</span> If you ever forget your password, we'll send you a
              reset link there — without it, you'll have to ask your landlord for a new login link.
            </span>
          </span>
          <Link
            to="/dashboard/tenant/settings"
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-gold-500 px-4 text-sm font-bold text-site-text ${ring}`}
          >
            Add Email
          </Link>
        </div>
      )}
      {payMessage && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-[#E3F2E7] px-4 py-3 text-sm font-medium text-[#1F6B3A]">
          <FaCheckCircle size={13} aria-hidden="true" /> {payMessage}
        </div>
      )}

      {profile && (
        <div className="mx-auto max-w-3xl space-y-4">
          {!profile.room && (
            <div className="rounded-xl bg-[#FFF1CC] px-4 py-3 text-sm font-medium text-[#6B4E00]">
              You haven't been assigned to a room yet. Contact your landlord or secretary.
            </div>
          )}

          {profile.room && (
            <>
              {/* Header + balance, as in the tenant design. */}
              <div>
                <div className="rounded-[18px] bg-brand-700 px-5 pb-16 pt-5 text-white">
                  <div className="text-[13px] text-[#F3D9A0]">Hello, {firstName}</div>
                  <div className="text-sm">{unit}</div>
                </div>
                <BalanceCard ps={profile.paymentStatus} rentFrequency={profile.room.rentFrequency} />
              </div>

              <div className={panel}>
                <h2 className="m-0 font-display text-lg font-bold">How to pay</h2>
                <p className="m-0 mt-1 text-[13px] text-site-muted">
                  {profile.onlinePaymentsAvailable
                    ? "Pay online below, or pay your landlord directly by transfer or cash and then let them know here."
                    : "Pay your landlord directly by transfer, cash or POS, then let them know here so they can record it."}
                </p>
                {/* Only shown when online payment is actually set up for this landlord. */}
                {profile.onlinePaymentsAvailable && (
                  <button
                    onClick={() => setShowMethodModal(true)}
                    disabled={paying}
                    className={`mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gold-500 px-4 font-bold text-site-text transition disabled:opacity-60 motion-safe:enabled:hover:-translate-y-0.5 ${ring}`}
                  >
                    {paying ? "Opening secure payment…" : `Pay rent online — ${formatNaira(profile.room.rentAmount)}`}
                  </button>
                )}
                <TellLandlord amount={Number(profile.paymentStatus?.outstanding || 0)} />
              </div>

              <div className={panel}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="m-0 font-display text-lg font-bold">Your receipts</h2>
                  <Link to="/dashboard/tenant/payments" className={`text-sm font-semibold text-brand-700 hover:underline ${ring}`}>
                    See all
                  </Link>
                </div>
                {!payments ? (
                  <p className="m-0 mt-3 text-sm text-site-muted">Loading…</p>
                ) : payments.length === 0 ? (
                  <p className="m-0 mt-3 text-sm text-site-muted">No payments recorded yet.</p>
                ) : (
                  <ul className="m-0 mt-2 list-none p-0">
                    {payments.slice(0, 3).map((p) => {
                      const s = PAY_STATUS[p.status] || { tone: "ink", label: p.status };
                      return (
                        <li key={p.id} className="flex items-center gap-3 border-t border-[#F3ECDF] py-3 first:border-t-0">
                          <div className="min-w-0 flex-grow">
                            <div className="text-sm font-semibold">Paid {formatDate(p.datePaid)}</div>
                            <div className="text-xs text-site-muted">
                              {formatNaira(p.amount)} · #{p.id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className={panel}>
                <h2 className="m-0 font-display text-lg font-bold">Your tenancy</h2>
                <dl className="m-0 mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                  {[
                    ["Property", profile.room.property.name],
                    ["Address", profile.room.property.address],
                    ["Room", profile.room.roomNumber],
                    ["Rent", `${formatNaira(profile.room.rentAmount)} per ${FREQUENCY_LABEL[profile.room.rentFrequency || "YEARLY"]}`],
                    ["Date commenced", formatDate(profile.dateCommencement)],
                    ["Date of expiration", formatDate(profile.dateExpiration)],
                    ["Renewal date", formatDate(profile.dateRenewal)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 sm:block">
                      <dt className="text-site-muted">{label}</dt>
                      <dd className="m-0 text-right font-semibold sm:text-left">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/tenant/payments"
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white transition hover:bg-brand-800 ${ring}`}
            >
              View Payment History <FaArrowRight size={12} aria-hidden="true" />
            </Link>
            <Link
              to="/dashboard/tenant/complaints"
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-site-border bg-white px-5 text-sm font-bold text-site-text transition hover:border-brand-300 ${ring}`}
            >
              Raise a Complaint <FaArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>

          <p className="text-xs text-site-muted">
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
              className={`flex min-h-[56px] w-full items-center gap-3.5 rounded-xl border border-site-border px-4 py-3 text-left transition hover:border-brand-300 hover:bg-site-cream ${ring}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F6E7BC] text-brand-700">
                <m.icon size={16} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-bold text-site-text">{m.label}</span>
                <span className="block text-xs text-site-muted">{m.sub}</span>
              </span>
            </button>
          ))}
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-site-cream px-3.5 py-3">
          <input
            type="checkbox"
            checked={enableRecurring}
            onChange={(e) => setEnableRecurring(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-site-border text-brand-700 focus:ring-gold-500"
          />
          <span className="text-xs text-site-muted">
            <span className="font-semibold text-site-text">Auto-pay my rent going forward</span> — automatically charge this payment method
            again each {FREQUENCY_LABEL[profile?.room?.rentFrequency || "YEARLY"]}, matching your lease.
          </span>
        </label>
        <p className="mt-3 text-xs text-site-muted">
          All methods are processed securely through Paystack — you'll complete payment in the window that opens next.
        </p>
      </Modal>
    </DashboardShell>
  );
}
