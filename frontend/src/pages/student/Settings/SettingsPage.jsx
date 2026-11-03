import { useState } from "react";
import { FiBell, FiCheck, FiLogOut, FiMoon, FiSend, FiSun } from "react-icons/fi";
import { api } from "../../../api/client";
import { splitName } from "../../../components/common/StudentIdCard.jsx";
import { describeDevice } from "../../../utils/device";
import Panel from "../../../components/student/Panel";
import { useTheme } from "../../../context/student/ThemeContext";
import { useNotificationPref } from "../../../context/student/NotificationPrefContext";
import { useNotifications } from "../../../context/student/NotificationsContext";
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

function Row({ title, hint, children }) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b py-4 first:pt-0 last:border-0 last:pb-0"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {hint && <p className="st-muted mt-0.5 text-xs">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="st-label">{label}</p>
      <p className="mt-0.5 break-words text-sm">{value || "—"}</p>
    </div>
  );
}

export default function SettingsPage({ onLogout, onNavigate }) {
  const { theme, setTheme } = useTheme();
  const { showBadge, toggleShowBadge } = useNotificationPref();
  const { unreadCount, markAllRead } = useNotifications();
  const { student } = useStudent();
  const [requested, setRequested] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [marking, setMarking] = useState(false);

  if (!student) return null;

  const { first, last } = splitName(student.name);
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  const signedIn = student.lastLogin;

  const requestPassword = async () => {
    setRequestError("");
    try {
      await api.requestTempPassword(student.studentId);
      setRequested(true);
    } catch {
      setRequestError("Could not send your request. Please try again.");
    }
  };

  const markAll = async () => {
    setMarking(true);
    await markAllRead();
    setMarking(false);
  };

  const themeButton = (value, Icon, label) => (
    <button
      type="button"
      onClick={() => setTheme(value)}
      aria-pressed={theme === value}
      className={`st-btn-sm flex-1 justify-center ${
        theme === value
          ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--on-gold)]"
          : "text-[var(--text-muted)] hover:border-[var(--gold)]"
      }`}
      style={theme === value ? undefined : { borderColor: "var(--line)" }}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <Panel title="My account">
        <div className="flex items-center gap-4">
          <div className="st-mono flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[var(--gold)] bg-[var(--card-2)] text-xl font-bold text-[var(--accent-text)]">
            {student.photo ? <img src={student.photo} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold">{student.name}</p>
            <p className="st-mono text-xs text-[var(--text-muted)]">{student.studentId}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail label="Program" value={student.course} />
          <Detail label="Year · Section" value={`${student.yearLevel || "—"} · ${student.section || "—"}`} />
          <Detail label="Email" value={student.email} />
          <Detail label="Account" value="Active" />
        </div>
        <p className="st-muted mt-4 text-xs leading-relaxed">
          Your name, ID, program and points are managed by your admin. You can edit your photo, bio, talent and
          hobbies on your ID card.
        </p>
        <button type="button" onClick={() => onNavigate?.("Activity")} className="st-btn-ghost mt-4 h-10 px-5 text-xs">
          Edit my ID card
        </button>
      </Panel>

      <Panel title="Preferences">
        <Row title="Appearance" hint="Dark suits low light; light is easier in bright rooms.">
          <div className="flex w-52 gap-2">
            {themeButton("dark", FiMoon, "Dark")}
            {themeButton("light", FiSun, "Light")}
          </div>
        </Row>
        <Row title="Notification badge" hint="Show the unread count on the bell.">
          <Toggle checked={showBadge} onChange={toggleShowBadge} label="Notification badge" />
        </Row>
        <Row title="Notifications" hint={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}>
          <button
            type="button"
            onClick={markAll}
            disabled={unreadCount === 0 || marking}
            className="st-btn-ghost h-9 px-4 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiCheck size={13} /> {marking ? "Marking..." : "Mark all read"}
          </button>
        </Row>
      </Panel>

      <Panel title="Security">
        <p className="st-muted text-sm leading-relaxed">
          Your password is yours alone, and only your admin can issue a new temporary one. If you forgot it, ask for
          one below, then sign in with your student number and the temporary password and choose a new one.
        </p>
        {requested ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--ok)]">
            <FiBell size={14} /> Request sent. Your admin will give you a new temporary password.
          </p>
        ) : (
          <button type="button" onClick={requestPassword} className="st-btn-ghost mt-4 h-10 px-5 text-xs">
            <FiSend size={13} /> Ask admin for a new password
          </button>
        )}
        {requestError && <p className="mt-2 text-sm font-medium text-[var(--danger)]">! {requestError}</p>}
        <div className="st-muted mt-5 border-t pt-4 text-xs" style={{ borderColor: "var(--line)" }}>
          <p>
            This device: <span className="text-[var(--text-primary)]">{describeDevice()}</span>
          </p>
          {signedIn && (
            <p className="mt-1">
              Signed in:{" "}
              <span className="text-[var(--text-primary)]">
                {new Date(signedIn).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          )}
        </div>
      </Panel>

      <button type="button" onClick={onLogout} className="st-btn-ghost w-full sm:w-auto sm:self-start sm:px-8">
        <FiLogOut size={16} /> Log out
      </button>
    </div>
  );
}
