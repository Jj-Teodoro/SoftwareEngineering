import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FiMoon, FiSun } from "react-icons/fi";
import { auth } from "@oasis/shared/firebaseClient.js";
import { useTheme } from "../context/ThemeContext";
import { useNotificationPref } from "../context/NotificationPrefContext";
import { useStudent } from "../context/StudentContext";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        checked ? "bg-[#97191d]" : "bg-[var(--surface-2)]"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
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

    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    setIsSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
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
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
        Settings
      </h2>

      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[2px] text-[var(--text-muted)]">
          Preferences
        </h3>

        <div className="flex items-center justify-between border-b border-[var(--surface-border)] py-3">
          <div className="flex items-center gap-3">
            {theme === "light" ? <FiSun size={18} /> : <FiMoon size={18} />}
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Dark Mode</p>
              <p className="text-xs text-[var(--text-muted)]">
                Switch between light and dark appearance.
              </p>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={toggleTheme} />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Notification Badge
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Show an unread count badge on the Notifications tab.
            </p>
          </div>
          <Toggle checked={showBadge} onChange={toggleShowBadge} />
        </div>
      </div>

      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-[2px] text-[var(--text-muted)]">
          Account
        </h3>
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
            className="h-11 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[#97191d]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            className="h-11 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[#97191d]"
          />
          {status && (
            <p
              className={`text-xs font-semibold ${
                status.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-full bg-[#97191d] text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
