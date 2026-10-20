import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import Panel from "../../../components/student/Panel";
import { useTheme } from "../../../context/student/ThemeContext";
import { useNotificationPref } from "../../../context/student/NotificationPrefContext";
import { useStudent } from "../../../context/student/StudentContext";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[var(--gold)]" : "bg-[var(--text-faint)]"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
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
    <div className="flex flex-col gap-5">
      <Panel title="Preferences">
        <div className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--card-2)] text-[var(--accent-text)]">
              {theme === "light" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </span>
            <div>
              <p className="text-sm font-semibold">Dark mode</p>
              <p className="st-muted text-xs">Switch between light and dark appearance.</p>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={toggleTheme} label="Dark mode" />
        </div>

        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            <p className="text-sm font-semibold">Notification badge</p>
            <p className="st-muted text-xs">Show an unread count on the bell icon.</p>
          </div>
          <Toggle checked={showBadge} onChange={toggleShowBadge} label="Notification badge" />
        </div>
      </Panel>

      <Panel title="Account">
        <p className="mb-3 text-sm font-semibold">
          {student?.name} <span className="st-muted font-normal">· {student?.studentId}</span>
        </p>
        <p className="st-muted mb-5 text-xs leading-relaxed">
          Forgot your password? Log out and use "Forgot password" on the login page to ask your admin
          for a new temporary password.
        </p>
        <button type="button" onClick={onLogout} className="st-btn-ghost w-full">
          <FiLogOut size={16} /> Log out
        </button>
      </Panel>
    </div>
  );
}
