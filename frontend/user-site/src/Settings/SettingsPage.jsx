import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { auth } from "@oasis/shared/firebaseClient.js";
import Panel from "../components/Panel";
import { useTheme } from "../context/ThemeContext";
import { useNotificationPref } from "../context/NotificationPrefContext";
import { useStudent } from "../context/StudentContext";

const inputClass =
  "h-11 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--gold)]";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full border border-[var(--surface-border)] transition-colors ${
        checked ? "bg-[var(--gold)]" : "bg-[var(--surface-2)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { showBadge, toggleShowBadge } = useNotificationPref();
  const { student } = useStudent();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }

    setIsSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setStatus({ type: "success", message: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setStatus({ type: "error", message: "Current password is incorrect." });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Preferences">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--surface-border)] pb-4">
          <div className="flex items-center gap-3">
            {theme === "light" ? <FiSun size={18} /> : <FiMoon size={18} />}
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Dark Mode</p>
              <p className="text-xs text-[var(--text-muted)]">
                Switch between light and dark appearance.
              </p>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={toggleTheme} label="Dark mode" />
        </div>

        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Notification Badge</p>
            <p className="text-xs text-[var(--text-muted)]">
              Show an unread count on the bell icon.
            </p>
          </div>
          <Toggle checked={showBadge} onChange={toggleShowBadge} label="Notification badge" />
        </div>
      </Panel>

      <Panel title="Account">
        <p className="mb-4 text-sm text-[var(--text-primary)]">
          {student?.name} · {student?.email}
        </p>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            className={inputClass}
          />
          {status && (
            <p
              className={`text-xs font-semibold ${
                status.type === "success" ? "text-green-500" : "text-red-400"
              }`}
            >
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg bg-[var(--gold)] text-sm font-bold uppercase tracking-[2px] text-[#2b0a0c] transition-all hover:brightness-110 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--surface-border)] text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-strong)]"
        >
          <FiLogOut size={16} /> Log Out
        </button>
      </Panel>
    </div>
  );
}
