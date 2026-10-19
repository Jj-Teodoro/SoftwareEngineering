import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import Panel from "../components/Panel";
import { useTheme } from "../context/ThemeContext";
import { useNotificationPref } from "../context/NotificationPrefContext";
import { useStudent } from "../context/StudentContext";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 border transition-all [clip-path:polygon(0_0,100%_0,100%_70%,calc(100%-7px)_100%,0_100%)] ${
        checked
          ? "border-[var(--neon-cyan)] bg-[rgba(5,217,232,0.25)] shadow-[0_0_10px_rgba(5,217,232,0.4)]"
          : "border-[var(--surface-border)] bg-[var(--surface-2)]"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 transition-transform ${
          checked
            ? "translate-x-6 bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]"
            : "translate-x-1 bg-[var(--text-faint)]"
        }`}
      />
    </button>
  );
}

export default function SettingsPage({ onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { showBadge, toggleShowBadge } = useNotificationPref();
  const { student } = useStudent();

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
        <p className="mb-4 font-mono text-sm text-[var(--text-primary)]">
          {student?.name} · {student?.email}
        </p>

        <p className="mb-4 font-mono text-xs leading-relaxed text-[var(--text-muted)]">
          Forgot your password? Log out and use "Forgot Password" on the login page to ask your
          admin for a new temporary password.
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="cp-btn-ghost h-11 w-full text-sm"
        >
          <FiLogOut size={16} /> Log Out
        </button>
      </Panel>
    </div>
  );
}
