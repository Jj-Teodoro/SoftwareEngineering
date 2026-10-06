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

        <p className="mb-4 text-xs leading-relaxed text-[var(--text-muted)]">
          Forgot your password? Log out and use "Forgot Password" on the login page to ask your
          admin for a new temporary password.
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--surface-border)] text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-strong)]"
        >
          <FiLogOut size={16} /> Log Out
        </button>
      </Panel>
    </div>
  );
}
