import { useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaCheckCircle, FaSearch, FaSyncAlt } from "react-icons/fa";
import DashboardShell from "../../components/dashboard/DashboardShell";
import FormField from "../../components/FormField";
import Toggle from "../../components/Toggle";
import { useAuth } from "../../context/AuthContext";
import { isUpdateAvailable, refreshApp } from "../../utils/appUpdate";

function loadPrefs(userId) {
  const raw = localStorage.getItem(`smartrent_prefs_${userId}`);
  return raw ? JSON.parse(raw) : { email: true, sms: false, push: true };
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
      <h2 className="text-sm font-bold text-ink-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Banner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700">
      <FaCheckCircle size={13} /> {message}
    </div>
  );
}

export default function Settings({ navItems }) {
  const { user, updateProfile, changePassword } = useAuth();

  const isTenant = user.role === "tenant";
  const [profile, setProfile] = useState({ fullName: user.fullName, phone: user.phone || "", email: user.email || "" });
  const [profileMsg, setProfileMsg] = useState("");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const [prefs, setPrefs] = useState(() => loadPrefs(user.id));

  function savePrefs(next) {
    setPrefs(next);
    localStorage.setItem(`smartrent_prefs_${user.id}`, JSON.stringify(next));
  }

  const [profileError, setProfileError] = useState("");

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    const result = await updateProfile({
      fullName: profile.fullName.trim(),
      phone: profile.phone.trim(),
      ...(isTenant && profile.email.trim() && { email: profile.email.trim() }),
    });
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setProfileMsg("Profile updated successfully.");
    setTimeout(() => setProfileMsg(""), 3000);
  }

  const [updateStatus, setUpdateStatus] = useState("");

  async function handleCheckForUpdates() {
    setUpdateStatus("Checking…");
    const available = await isUpdateAvailable();
    if (available) setUpdateStatus("A new version is available — tap Refresh App.");
    else if (available === false) setUpdateStatus("You're on the latest version.");
    else setUpdateStatus("Couldn't check right now. Refresh App will still load the latest version.");
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    if (pwForm.next.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match.");
      return;
    }
    const result = await changePassword(pwForm.current, pwForm.next);
    if (!result.ok) {
      setPwError(result.error);
      return;
    }
    setPwMsg("Password changed successfully.");
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwMsg(""), 3000);
  }

  return (
    <DashboardShell navItems={navItems} title="Settings" subtitle="Manage your account and preferences">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card title="Profile Information">
          <Banner message={profileMsg} />
          <form onSubmit={handleProfileSubmit}>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">{user.fullName}</div>
                <div className="text-xs capitalize text-ink-400">{user.role}</div>
              </div>
            </div>
            <FormField
              label="Full Name"
              name="fullName"
              icon={FaUser}
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
            {isTenant ? (
              <>
                {!user.email && (
                  <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    Add your email so you can reset your password yourself if you ever forget it.
                  </p>
                )}
                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  icon={FaEnvelope}
                  placeholder="you@example.com"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </>
            ) : (
              <FormField label="Email Address" name="email" icon={FaEnvelope} value={user.email || ""} onChange={() => {}} disabled />
            )}
            <FormField
              label="Phone Number"
              name="phone"
              icon={FaPhone}
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
            {profileError && <p className="mb-4 text-sm font-medium text-red-500">{profileError}</p>}
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
            >
              Save Changes
            </button>
          </form>
        </Card>

        <Card title="Change Password">
          <Banner message={pwMsg} />
          <form onSubmit={handlePasswordSubmit}>
            <FormField
              label="Current Password"
              name="current"
              icon={FaLock}
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
              required
            />
            <FormField
              label="New Password"
              name="next"
              icon={FaLock}
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
              required
            />
            <FormField
              label="Confirm New Password"
              name="confirm"
              icon={FaLock}
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              required
            />
            {pwError && <p className="mb-4 text-sm font-medium text-red-500">{pwError}</p>}
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-600"
            >
              Update Password
            </button>
          </form>
        </Card>

        <Card title="App Updates">
          <p className="text-sm text-ink-500">
            If something looks out of date, refresh to load the newest version of RentaFlow. You'll stay logged in.
          </p>
          {updateStatus && <p className="mt-3 text-sm font-medium text-brand-700">{updateStatus}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleCheckForUpdates}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-bold text-ink-700 hover:bg-ink-50"
            >
              <FaSearch size={12} /> Check for Updates
            </button>
            <button
              onClick={refreshApp}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-brand-600"
            >
              <FaSyncAlt size={12} /> Refresh App
            </button>
          </div>
        </Card>

        <Card title="Notification Preferences">
          <div className="divide-y divide-ink-100">
            <Toggle
              label="Email Notifications"
              description="Payment confirmations, reminders, and updates"
              checked={prefs.email}
              onChange={(v) => savePrefs({ ...prefs, email: v })}
            />
            <Toggle
              label="SMS Notifications"
              description="Text message alerts for urgent updates"
              checked={prefs.sms}
              onChange={(v) => savePrefs({ ...prefs, sms: v })}
            />
            <Toggle
              label="Push Notifications"
              description="Browser notifications while using RentaFlow"
              checked={prefs.push}
              onChange={(v) => savePrefs({ ...prefs, push: v })}
            />
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
