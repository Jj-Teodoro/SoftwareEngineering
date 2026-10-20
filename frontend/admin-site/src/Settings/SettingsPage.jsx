import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { FiCopy, FiKey, FiMonitor, FiPlus, FiRefreshCw, FiSmartphone, FiTrash2 } from "react-icons/fi";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { useConfirm } from "@oasis/shared/components/ConfirmDialog.jsx";
import { EmptyState, PageHeader, Section } from "@oasis/shared/components/ui.jsx";
import { staffKey } from "@oasis/shared/utils/staffAuth.js";
import { useStaff } from "../context/StaffContext";
import { useStudents } from "../context/StudentsContext";
import { useEvents } from "../context/EventsContext";
import { useRequirements } from "../context/RequirementsContext";
import { formatAgo } from "../context/PresenceContext";

// One grid for header and rows: a card on phones, a table row from lg up.
const ROW =
  "grid grid-cols-2 items-center gap-x-4 gap-y-2.5 px-4 py-3 lg:grid-cols-[minmax(0,1.5fr)_130px_minmax(0,2fr)_130px_minmax(0,1.2fr)]";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the text stays visible to copy by hand
    }
  };
  return (
    <button type="button" onClick={copy} className="btn-ghost btn-sm">
      <FiCopy size={12} /> {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Credentials({ username, password, heading }) {
  return (
    <div className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-3">
      <p className="label text-gold">{heading}</p>
      <p className="mt-1.5 text-sm">
        Username <span className="font-mono font-bold">{username}</span>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <p className="text-sm">
          Temporary password <span className="select-all font-mono text-base font-bold tracking-widest">{password}</span>
        </p>
        <CopyButton text={password} />
      </div>
      <p className="mt-1.5 text-xs muted">They'll be asked to choose their own password the first time they sign in.</p>
    </div>
  );
}

// Temporary password of a scanner who hasn't signed in yet.
function PendingPassword({ member }) {
  const [password, setPassword] = useState(undefined);
  useEffect(
    () =>
      onSnapshot(
        doc(db, "accountCredentials", staffKey(member.username)),
        (snap) => setPassword(snap.exists() ? snap.data().tempPassword : null),
        () => setPassword(null)
      ),
    [member.username]
  );
  if (password === undefined) return null;
  if (!password) return <p className="text-xs muted">Waiting for first sign-in. Use "New password" to issue another.</p>;
  return <Credentials heading="Give these to them — visible until they set their own" username={member.username} password={password} />;
}

function MyAccount({ user }) {
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
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, current));
      await updatePassword(auth.currentUser, next);
      setStatus({ ok: true, text: "Password updated." });
      setCurrent("");
      setNext("");
    } catch {
      setStatus({ ok: false, text: "Current password is incorrect." });
    }
    setBusy(false);
  };

  return (
    <Section title="My account">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-base font-semibold">{user?.name}</p>
          <p className="font-mono text-xs muted">{user?.username} · {user?.role}</p>
          <p className="mt-3 text-xs leading-relaxed muted">
            Admin accounts are the only ones that can change their own password. Scanner accounts get a new
            temporary password from you (see below).
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" autoComplete="current-password" required className="input" />
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" required className="input" />
          {status && <p className={`text-sm ${status.ok ? "text-green-300" : "text-neon-pink"}`}>{status.text}</p>}
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Updating..." : "Change my password"}</button>
        </form>
      </div>
    </Section>
  );
}

function StaffAccounts({ user }) {
  const { staff, getActivity, now, createScanner, issuePassword, removeStaff } = useStaff();
  const { resetRequests, dismissRequest } = useStudents();
  const confirm = useConfirm();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState(null); // credentials just created or re-issued
  const [busyUid, setBusyUid] = useState(null);

  const members = [...staff].sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "admin" ? -1 : 1));
  const activeCount = members.filter((m) => getActivity(m.uid).active).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    const result = await createScanner({ name, username });
    setCreating(false);
    if (!result.ok) return setError(result.message);
    setIssued({ username: result.username, password: result.tempPassword, heading: "Scanner account created — give these to them" });
    setName("");
    setUsername("");
  };

  const handleIssue = async (member) => {
    const ok = await confirm({
      title: "Issue new temporary password",
      message: `${member.name}'s current password will stop working and they'll have to choose a new one at their next sign-in.`,
      confirmLabel: "Issue",
    });
    if (!ok) return;
    setBusyUid(member.uid);
    const result = await issuePassword(member);
    setBusyUid(null);
    if (!result.ok) return setError(result.message);
    setError("");
    setIssued({ username: result.username, password: result.tempPassword, heading: `New temporary password for ${member.name}` });
  };

  const handleRemove = async (member) => {
    const ok = await confirm({
      title: "Remove account",
      message: `Remove ${member.name} (${member.username})? They won't be able to sign in any more. This cannot be undone.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    setBusyUid(member.uid);
    const result = await removeStaff(member);
    setBusyUid(null);
    setError(result.ok ? "" : result.message);
  };

  return (
    <Section
      title="Staff accounts & activity"
      action={<span className="chip-green"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> {activeCount} active now</span>}
    >
      <form onSubmit={handleCreate} className="surface-inset mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label mb-1.5 block">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan Dela Cruz" className="input" required />
        </div>
        <div>
          <label className="label mb-1.5 block">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. juan.scanner" className="input" required />
        </div>
        <button type="submit" disabled={creating} className="btn-primary"><FiPlus size={14} /> {creating ? "Creating..." : "Add scanner"}</button>
      </form>

      {error && <p className="mb-3 text-sm text-neon-pink">{error}</p>}
      {issued && (
        <div className="mb-4">
          <Credentials heading={issued.heading} username={issued.username} password={issued.password} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className={`${ROW} hidden border-b border-white/10 bg-white/[0.03] lg:grid`}>
          {["Person", "Status", "Using", "Account", ""].map((h, i) => <span key={i} className="label">{h}</span>)}
        </div>

        {members.length === 0 && <EmptyState>No staff accounts yet.</EmptyState>}

        {members.map((m) => {
          const a = getActivity(m.uid);
          const isMe = m.uid === user?.uid;
          const requested = Boolean(resetRequests[staffKey(m.username)]);
          const isScanner = m.role === "scanner";
          const pending = isScanner && m.mustChangePassword;
          return (
            <div key={m.uid} className="border-b border-white/10 last:border-0">
              <div className={ROW}>
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <p className="truncate text-sm font-semibold">{m.name}{isMe && <span className="ml-2 text-xs text-white/40">(you)</span>}</p>
                  <p className="font-mono text-xs text-white/45">{m.username} · {m.role}</p>
                </div>

                <div className="min-w-0">
                  <span className={a.active ? "chip-green" : "chip-gray"}>
                    <span className={`h-1.5 w-1.5 rounded-full bg-current ${a.active ? "animate-pulse" : ""}`} />
                    {a.active ? "Active now" : "Offline"}
                  </span>
                  {!a.active && (
                    <p className="mt-1 text-[11px] text-white/45">{a.lastSeen ? `Last seen ${formatAgo(a.lastSeen, now)}` : "Never signed in"}</p>
                  )}
                </div>

                <div className="col-span-2 min-w-0 lg:col-span-1">
                  {a.lastSeen ? (
                    <>
                      <p className="flex items-center gap-1.5 text-sm">
                        <FiMonitor size={13} className="shrink-0 text-gold" />
                        <span className="truncate">
                          {a.app === "admin" ? "Admin site" : "Scanner site"}
                          {a.page ? ` · ${a.page}` : ""}
                          {a.event ? ` · ${a.event}` : ""}
                        </span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
                        <FiSmartphone size={12} className="shrink-0" /> <span className="truncate">{a.device || "Unknown device"}</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-white/40">—</p>
                  )}
                </div>

                <div>
                  {requested ? (
                    <span className="chip-amber"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> Reset requested</span>
                  ) : pending ? (
                    <span className="chip-amber">Pending</span>
                  ) : (
                    <span className="chip-green">Active</span>
                  )}
                </div>

                <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-1 lg:justify-end">
                  {isScanner && !isMe && (
                    <>
                      <button type="button" onClick={() => handleIssue(m)} disabled={busyUid === m.uid} className="btn-ghost btn-sm">
                        <FiRefreshCw size={12} /> {busyUid === m.uid ? "Working..." : "New password"}
                      </button>
                      <button type="button" onClick={() => handleRemove(m)} disabled={busyUid === m.uid} className="btn-danger btn-sm" aria-label={`Remove ${m.name}`}>
                        <FiTrash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {(pending || requested) && isScanner && (
                <div className="space-y-2 px-4 pb-3">
                  {requested && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2">
                      <p className="flex-1 text-sm font-semibold text-gold">{m.name} asked for a new temporary password.</p>
                      <button type="button" onClick={() => handleIssue(m)} className="btn-primary btn-sm">Issue password</button>
                      <button type="button" onClick={() => dismissRequest(staffKey(m.username))} className="btn-ghost btn-sm">Dismiss</button>
                    </div>
                  )}
                  {pending && !requested && <PendingPassword member={m} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/45">
        "Using" shows the page, the event if they're running a kiosk, and the browser and device they signed in on.
        Status updates about every 30 seconds.
      </p>
    </Section>
  );
}

function SystemInfo() {
  const { students } = useStudents();
  const { events } = useEvents();
  const { items } = useRequirements();
  const { staff } = useStaff();
  const stats = [
    ["Students", students.length],
    ["Events", events.length],
    ["Requirements", items.length],
    ["Staff accounts", staff.length],
  ];

  return (
    <Section title="System">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="surface-inset p-3">
            <p className="font-mono text-2xl font-bold leading-none">{value}</p>
            <p className="label mt-1.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm leading-relaxed muted">
        <p>
          <FiKey size={13} className="mr-1.5 inline text-gold" />
          <span className="font-semibold text-white">How clearance works:</span> a student's target is the sum of every
          requirement and event that applies to their program. They're cleared when they've earned all of it. Adding or
          removing a requirement or event changes the targets right away.
        </p>
        <p className="font-mono text-xs text-white/40">
          Project: {import.meta.env.VITE_FIREBASE_PROJECT_ID || "—"}
        </p>
      </div>
    </Section>
  );
}

export default function SettingsPage({ currentUser }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Your account, the people who use the scanner, and how the system is set up." />
      <MyAccount user={currentUser} />
      <StaffAccounts user={currentUser} />
      <SystemInfo />
    </div>
  );
}
