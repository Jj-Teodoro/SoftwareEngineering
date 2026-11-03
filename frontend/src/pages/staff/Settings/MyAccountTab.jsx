import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiHelpCircle, FiRefreshCw } from "react-icons/fi";
import { api } from "../../../api/client";
import { toStaff } from "../../../api/mappers";
import { Section } from "../../../components/common/ui.jsx";
import { describeDevice } from "../../../utils/device";

const when = (iso) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// What each recorded action reads like. `detail` is the event title, student number, and so on.
const ACTION_TEXT = {
  "profile.updated": () => "Updated your name",
  "password.changed": () => "Changed your password",
  "password.issued": (d) => `Issued a new temporary password for ${d}`,
  "staff.created": (d) => `Created the staff account ${d}`,
  "staff.removed": (d) => `Removed the account ${d}`,
  "event.created": (d) => `Created the event "${d}"`,
  "event.updated": (d) => `Edited the event "${d}"`,
  "event.deleted": (d) => `Deleted the event "${d}"`,
  "student.added": (d) => `Added student ${d}`,
  "student.updated": (d) => `Edited student ${d}`,
  "student.deleted": (d) => `Deleted student ${d}`,
  "students.imported": (d) => `Imported ${d}`,
  "students.deleted": (d) => `Deleted ${d}`,
  "requirement.created": (d) => `Added the requirement "${d}"`,
  "requirement.updated": (d) => `Edited the requirement "${d}"`,
  "requirement.deleted": (d) => `Removed the requirement "${d}"`,
  "settings.clearance": (d) => `Set the points needed for clearance to ${d}`,
  "attendance.in": (d) => `Checked in ${d}`,
  "attendance.out": (d) => `Checked out ${d}`,
};
const describeAction = (entry) => (ACTION_TEXT[entry.action] || (() => entry.action))(entry.detail);

function Profile({ user, onUserChange, onSaved }) {
  const [form, setForm] = useState(null); // null while just viewing
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const start = () => {
    setStatus(null);
    setForm({ first_name: user.firstName || "", middle_name: user.middleName || "", last_name: user.lastName || "" });
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const updated = await api.updateProfile(form);
      onUserChange?.(toStaff(updated));
      setForm(null);
      setStatus({ ok: true, text: "Name updated." });
      onSaved();
    } catch (error) {
      setStatus({ ok: false, text: error.message || "Could not save your name." });
    }
    setBusy(false);
  };

  return (
    <Section title="Profile">
      {form ? (
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label mb-1 block">First name</span>
              <input value={form.first_name} onChange={set("first_name")} className="input" autoComplete="given-name" />
            </label>
            <label className="block">
              <span className="label mb-1 block">Last name</span>
              <input value={form.last_name} onChange={set("last_name")} className="input" autoComplete="family-name" />
            </label>
          </div>
          <label className="block sm:max-w-[50%]">
            <span className="label mb-1 block">Middle name (optional)</span>
            <input value={form.middle_name} onChange={set("middle_name")} className="input" />
          </label>
          {status && !status.ok && <p className="text-sm text-neon-pink">{status.text}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary btn-sm">{busy ? "Saving..." : "Save name"}</button>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-lg font-semibold">{user?.name}</p>
          <p className="mt-0.5 font-mono text-xs muted">
            {user?.username} · {user?.role}
          </p>
          <p className="mt-3 text-xs leading-relaxed muted">
            Your username is how you sign in and can't be changed here. Your name shows on the events you create.
          </p>
          {status?.ok && <p className="mt-2 text-sm text-green-300">{status.text}</p>}
          <button type="button" onClick={start} className="btn-ghost btn-sm mt-4">Change my name</button>
        </>
      )}
    </Section>
  );
}

function Password({ onSaved }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (next.length < 8) return setStatus({ ok: false, text: "New password must be at least 8 characters." });
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setStatus({ ok: true, text: "Password updated." });
      setCurrent("");
      setNext("");
      onSaved();
    } catch (error) {
      setStatus({ ok: false, text: error.data?.current_password ? "Current password is incorrect." : error.message });
    }
    setBusy(false);
  };

  return (
    <Section title="Password">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" autoComplete="current-password" required className="input" />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" required className="input" />
        {status && <p className={`text-sm ${status.ok ? "text-green-300" : "text-neon-pink"}`}>{status.text}</p>}
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Updating..." : "Change my password"}</button>
      </form>

      <details className="surface-inset mt-4 p-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
          <FiHelpCircle size={14} className="text-gold" /> Forgot your current password?
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed muted">
          <li>Sign out. On the login screen choose "Forgot password" so the other admins see your request.</li>
          <li>Another admin opens Settings, then Staff, and clicks "New password" next to your name. They give you the temporary password, and you choose your own at your next sign-in.</li>
          <li>
            If you are the only admin, whoever runs the server can reset it with{" "}
            <span className="select-all font-mono text-white">python manage.py changepassword your-username</span>.
          </li>
        </ol>
      </details>
    </Section>
  );
}

function Security({ data, loading, error, reload }) {
  const failed = data?.failed_last_day || 0;
  return (
    <Section
      title="Sign-ins and security"
      action={
        <button type="button" onClick={reload} className="btn-ghost btn-sm" aria-label="Refresh">
          <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      }
    >
      <p className="text-xs muted">
        This device: <span className="text-white">{describeDevice()}</span>
      </p>

      {failed > 0 && (
        <div className="mt-3 flex gap-2 rounded-lg border border-neon-pink/50 bg-neon-pink/10 px-3 py-2 text-sm">
          <FiAlertTriangle size={15} className="mt-0.5 shrink-0 text-neon-pink" />
          <p>
            <span className="font-semibold">{failed} wrong-password attempt{failed === 1 ? "" : "s"}</span> on your
            account in the last 24 hours. If that wasn't you, change your password now.
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-neon-pink">{error}</p>}

      <ul className="mt-3 divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
        {data?.sign_ins?.length === 0 && <li className="px-3 py-3 text-xs muted">No sign-ins recorded yet.</li>}
        {data?.sign_ins?.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 px-3 py-2.5">
            {entry.kind === "failed" ? (
              <FiAlertTriangle size={15} className="mt-0.5 shrink-0 text-neon-pink" />
            ) : (
              <FiCheckCircle size={15} className="mt-0.5 shrink-0 text-green-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {entry.kind === "failed" ? <span className="text-neon-pink">Wrong password</span> : "Signed in"}
                <span className="text-white/45"> · {when(entry.at)}</span>
              </p>
              <p className="truncate text-xs text-white/50">
                {entry.device || "Unknown device"}
                {entry.ip ? ` · ${entry.ip}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Activity({ data }) {
  return (
    <Section title="My recent activity">
      <ul className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10">
        {data?.actions?.length === 0 && (
          <li className="px-3 py-3 text-xs muted">Nothing yet. Events, students and accounts you change show up here.</li>
        )}
        {data?.actions?.map((entry) => (
          <li key={entry.id} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0 text-sm">{describeAction(entry)}</span>
            <span className="shrink-0 text-xs text-white/45">{when(entry.at)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default function MyAccountTab({ user, onUserChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.myActivity());
      setError("");
    } catch {
      setError("Could not load your recent sign-ins.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Profile user={user} onUserChange={onUserChange} onSaved={reload} />
        <Password onSaved={reload} />
      </div>
      <div className="flex flex-col gap-5">
        <Security data={data} loading={loading} error={error} reload={reload} />
        <Activity data={data} />
      </div>
    </div>
  );
}
