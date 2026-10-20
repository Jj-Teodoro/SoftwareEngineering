import { useState } from "react";
import { FiLogOut, FiMonitor, FiSend, FiSmartphone } from "react-icons/fi";
import { auth } from "@oasis/shared/firebaseClient.js";
import { PageHeader, Section } from "@oasis/shared/components/ui.jsx";
import { describeDevice } from "@oasis/shared/utils/device.js";
import { useAuth } from "../context/AuthContext";

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

export default function SettingsPage({ currentUser, onLogout }) {
  const { requestPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signedInAt = auth.currentUser?.metadata?.lastSignInTime;

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

      <Section title="Password">
        <p className="text-sm leading-relaxed muted">
          Your password is managed by your admin. If you forgot it, or think someone else knows it, ask for a new
          temporary password. You'll be asked to choose your own the next time you sign in.
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
