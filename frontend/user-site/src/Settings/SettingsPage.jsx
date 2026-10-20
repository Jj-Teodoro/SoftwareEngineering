import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FiBell, FiCheck, FiLogOut, FiMoon, FiSend, FiSun } from "react-icons/fi";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { splitName } from "@oasis/shared/components/StudentIdCard.jsx";
import { describeDevice } from "@oasis/shared/utils/device.js";
import Panel from "../components/Panel";
import { useTheme } from "../context/ThemeContext";
import { useNotificationPref } from "../context/NotificationPrefContext";
import { useNotifications } from "../context/NotificationsContext";
import { useStudent } from "../context/StudentContext";

const cut = "[clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]";

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
          ? "border-[var(--gold)] bg-[var(--gold)]/25 shadow-[0_0_10px_var(--glow)]"
          : "border-[var(--surface-border)] bg-[var(--surface-2)]"
      }`}
    >
      <span
        className={`absolute left-0 top-0.5 h-5 w-5 transition-transform ${
          checked ? "translate-x-6 bg-[var(--gold)] shadow-[0_0_8px_var(--gold)]" : "translate-x-1 bg-[var(--text-faint)]"
        }`}
      />
    </button>
  );
}

function Row({ title, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--surface-border)] py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[2px] text-[var(--gold)]">{label}</p>
      <p className="mt-0.5 break-words text-sm text-[var(--text-primary)]">{value || "—"}</p>
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
  const signedIn = auth.currentUser?.metadata?.lastSignInTime;

  const requestPassword = async () => {
    setRequestError("");
    try {
      await setDoc(doc(db, "passwordRequests", student.studentId), { requestedAt: serverTimestamp() });
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
      className={`flex flex-1 items-center justify-center gap-2 border px-4 py-2 font-mono text-xs uppercase tracking-[2px] transition-all ${cut} ${
        theme === value
          ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]"
          : "border-[var(--surface-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <Panel title="My account">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-2 border-[var(--gold)] bg-[var(--surface-2)] font-display text-xl text-[var(--gold)]">
            {student.photo ? <img src={student.photo} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold uppercase tracking-[1px] text-[var(--text-primary)]">{student.name}</p>
            <p className="font-mono text-xs text-[var(--text-muted)]">{student.studentId}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail label="Program" value={student.course} />
          <Detail label="Year · Section" value={`${student.yearLevel || "—"} · ${student.section || "—"}`} />
          <Detail label="Email" value={student.email} />
          <Detail label="Account" value="Active" />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
          Your name, ID, program and points are managed by your admin. You can edit your photo, bio, talent and
          hobbies on your ID card.
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.("Activity")}
          className="cp-btn-ghost mt-4 h-10 px-5 text-xs"
        >
          Edit my ID card
        </button>
      </Panel>

      <Panel title="Preferences">
        <Row title="Appearance" hint="Dark suits low light; light is easier in bright rooms.">
          <div className="flex w-56 gap-2">
            {themeButton("dark", FiMoon, "Dark")}
            {themeButton("light", FiSun, "Light")}
          </div>
        </Row>
        <Row title="Notification badge" hint="Show the unread count on the bell.">
          <Toggle checked={showBadge} onChange={toggleShowBadge} label="Notification badge" />
        </Row>
        <Row
          title="Notifications"
          hint={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        >
          <button
            type="button"
            onClick={markAll}
            disabled={unreadCount === 0 || marking}
            className="cp-btn-ghost h-9 px-4 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiCheck size={13} /> {marking ? "Marking..." : "Mark all read"}
          </button>
        </Row>
      </Panel>

      <Panel title="Security">
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Your password is yours alone, and only your admin can issue a new temporary one. If you forgot it, ask for
          one below, then sign in with your email and the temporary password and choose a new one.
        </p>
        {requested ? (
          <p className="mt-4 flex items-center gap-2 font-mono text-sm text-[var(--gold)]">
            <FiBell size={14} /> Request sent. Your admin will give you a new temporary password.
          </p>
        ) : (
          <button type="button" onClick={requestPassword} className="cp-btn-ghost mt-4 h-10 px-5 text-xs">
            <FiSend size={13} /> Ask admin for a new password
          </button>
        )}
        {requestError && <p className="mt-2 font-mono text-xs text-[var(--neon-pink)]">! {requestError}</p>}
        <div className="mt-5 border-t border-[var(--surface-border)] pt-4 text-xs text-[var(--text-muted)]">
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

      <button type="button" onClick={onLogout} className="cp-btn-ghost h-11 w-full text-sm sm:w-auto sm:px-8">
        <FiLogOut size={16} /> Log out
      </button>
    </div>
  );
}
