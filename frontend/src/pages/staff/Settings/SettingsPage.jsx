import { useState } from "react";
import { FiLogOut, FiMonitor, FiSend, FiSmartphone } from "react-icons/fi";
import { api } from "../../../api/client";
import { PageHeader, Section } from "../../../components/common/ui.jsx";
import { describeDevice } from "../../../utils/device";
import { useStaffAuth } from "../../../context/staff/AuthContext";

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 border-b border-white/10 py-3 last:border-0">
      <Icon size={15} className="mt-0.5 shrink-0 text-gold" />
      <div className="min-w-0">
        <p className="label">{label}</p>
        <p className="mt-0.5 break-words text-sm">{children}</p>
      </div>
    </div>
  );
}

const MIN_PASSWORD_LENGTH = 6;

// SRS FR-07 / F.2.5: a scanner changes their own password after entering the current one.
function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setStatus({ type: "error", message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setStatus({ type: "success", message: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error.data?.current_password ? "Current password is incorrect." : error.message,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Section title="Change password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          required
          className="input h-11"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={`New password (min. ${MIN_PASSWORD_LENGTH} characters)`}
          autoComplete="new-password"
          required
          className="input h-11"
        />
        {status && (
          <p className={`text-sm ${status.type === "success" ? "text-green-300" : "text-neon-pink"}`}>{status.message}</p>
        )}
        <button type="submit" disabled={isSubmitting} className="btn-primary h-11">
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </Section>
  );
}

export default function SettingsPage({ currentUser, onLogout }) {
  const { requestPassword } = useStaffAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signedInAt = currentUser?.lastLogin;

  const handleRequest = async () => {
    setBusy(true);
    setError("");
    const result = await requestPassword(currentUser.username);
    setBusy(false);
    if (result.ok) setSent(true);
    else setError(result.message);
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageHeader title="Settings" subtitle="Your account and this session." />

      <Section title="Your account">
        <p className="text-base font-semibold">{currentUser?.name}</p>
        <p className="font-mono text-xs muted">{currentUser?.username} · {currentUser?.role}</p>
      </Section>

      <Section title="This session">
        <Row icon={FiMonitor} label="Site">Scanner site</Row>
        <Row icon={FiSmartphone} label="Device">{describeDevice()}</Row>
        {signedInAt && (
          <Row icon={FiMonitor} label="Signed in">
            {new Date(signedInAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </Row>
        )}
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Your admin can see that you're signed in, which page or event you're on, and this device.
        </p>
      </Section>

      <ChangePassword />

      <Section title="Forgot your password?">
        <p className="text-sm leading-relaxed muted">
          If you forgot it, or think someone else knows it, ask your admin for a new temporary password. You'll be
          asked to choose your own the next time you sign in.
        </p>
        {sent ? (
          <p className="mt-3 text-sm text-green-300">Request sent. Your admin will give you a new temporary password.</p>
        ) : (
          <button type="button" onClick={handleRequest} disabled={busy} className="btn-ghost mt-4">
            <FiSend size={14} /> {busy ? "Sending..." : "Ask admin for a new password"}
          </button>
        )}
        {error && <p className="mt-2 text-sm text-neon-pink">{error}</p>}
      </Section>

      <button type="button" onClick={onLogout} className="btn-ghost h-11 w-full sm:w-auto">
        <FiLogOut size={15} /> Log out
      </button>
    </div>
  );
}
