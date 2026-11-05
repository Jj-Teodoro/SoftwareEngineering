import { useEffect, useState } from "react";
import { FiCopy, FiKey, FiMonitor, FiPlus, FiRefreshCw, FiSmartphone, FiTrash2 } from "react-icons/fi";
import { api } from "../../../api/client";
import { useConfirm } from "../../../components/common/ConfirmDialog.jsx";
import AddStudentModal from "../../../components/staff/AddStudentModal";
import { EmptyState, PageHeader, Section } from "../../../components/common/ui.jsx";
import { useStaff } from "../../../context/staff/StaffContext";
import { useStudents } from "../../../context/staff/StudentsContext";
import { useEvents } from "../../../context/staff/EventsContext";
import MyAccountTab from "./MyAccountTab";
import PointsTab from "./PointsTab";
import { useRequirements } from "../../../context/staff/RequirementsContext";
import { formatAgo } from "../../../context/staff/PresenceContext";

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
  useEffect(() => {
    let cancelled = false;
    api.users
      .storedTempPassword(member.username)
      .then((data) => !cancelled && setPassword(data.temp_password))
      .catch(() => !cancelled && setPassword(null));
    return () => {
      cancelled = true;
    };
  }, [member.username]);
  if (password === undefined) return null;
  if (!password) return <p className="text-xs muted">Waiting for first sign-in. Use "New password" to issue another.</p>;
  return <Credentials heading="Give these to them — visible until they set their own" username={member.username} password={password} />;
}

function StaffAccounts({ user }) {
  const { staff, getActivity, now, createStaff, issuePassword, removeStaff, dismissRequest, changeRole } = useStaff();
  const confirm = useConfirm();

  const [newRole, setNewRole] = useState(null); // "admin" / "scanner" while its form is open
  const [error, setError] = useState("");
  const [issued, setIssued] = useState(null); // credentials just created or re-issued
  const [busyUid, setBusyUid] = useState(null);
  const [filter, setFilter] = useState("all"); // all / admin / scanner

  const members = [...staff].sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "admin" ? -1 : 1));
  const activeCount = members.filter((m) => getActivity(m.uid).active).length;

  // Same fields as a new student record; the ID number becomes their username.
  const handleCreate = async (fields) => {
    const result = await createStaff(fields, newRole);
    if (result.ok) {
      setError("");
      const label = newRole === "admin" ? "Admin" : "Scanner";
      setIssued({ username: result.username, password: result.tempPassword, heading: `${label} account created — give these to them` });
    }
    return result;
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

  const ROLE_TEXT = { admin: "an admin", scanner: "a scanner", student: "a student" };
  const handleRole = async (member, role) => {
    if (role === member.role) return;
    const ok = await confirm({
      title: "Change role",
      message:
        role === "student"
          ? `Make ${member.name} a student? They lose access to the ${member.role} site and appear in the student list instead.`
          : `Make ${member.name} ${ROLE_TEXT[role]}? ${
              role === "admin"
                ? "They will be able to manage students, events, accounts and settings."
                : "They will only be able to scan attendance; admin pages are no longer available to them."
            }`,
      confirmLabel: "Change role",
      danger: role === "student",
    });
    if (!ok) return;
    setBusyUid(member.uid);
    const result = await changeRole(member, role);
    setBusyUid(null);
    if (!result.ok) return setError(result.message);
    setError("");
    if (result.tempPassword) {
      setIssued({ username: member.username, password: result.tempPassword, heading: `${member.name} is now ${ROLE_TEXT[role]} — give these to them` });
    }
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

  const shown = members.filter((m) => filter === "all" || m.role === filter);
  const counts = {
    all: members.length,
    admin: members.filter((m) => m.role === "admin").length,
    scanner: members.filter((m) => m.role === "scanner").length,
  };

  return (
    <Section
      title="Staff accounts"
      action={
        <span className="chip-green">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> {activeCount} active now
        </span>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Show">
          {[
            ["all", "All"],
            ["admin", "Admins"],
            ["scanner", "Scanners"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === id ? "bg-gold/15 text-gold" : "text-white/60 hover:text-white"
              }`}
            >
              {label} <span className="text-white/40">{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setNewRole("scanner")} className="btn-primary btn-sm">
            <FiPlus size={13} /> Add scanner
          </button>
          <button type="button" onClick={() => setNewRole("admin")} className="btn-ghost btn-sm">
            <FiPlus size={13} /> Add admin
          </button>
        </div>
      </div>

      {newRole && (
        <AddStudentModal
          title={newRole === "admin" ? "Add Admin Account" : "Add Scanner Account"}
          idLabel="ID Number (used to sign in)"
          emailPlaceholder="name@dyci.edu.ph"
          submitLabel={newRole === "admin" ? "Add Admin" : "Add Scanner"}
          onClose={() => setNewRole(null)}
          onSave={handleCreate}
        />
      )}

      {error && <p className="mb-3 text-sm text-neon-pink">{error}</p>}
      {issued && (
        <div className="mb-4">
          <Credentials heading={issued.heading} username={issued.username} password={issued.password} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/10">
        {shown.length === 0 && <EmptyState>No {filter === "all" ? "staff" : filter} accounts yet.</EmptyState>}

        {shown.map((m) => {
          const a = getActivity(m.uid);
          const isMe = m.uid === user?.uid;
          const requested = Boolean(m.passwordRequestedAt);
          // every account except your own can be reset or removed here
          const canManage = !isMe;
          const pending = canManage && m.mustChangePassword;
          const initials = m.name
            .split(/[\s,]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();
          return (
            <div key={m.uid} className="border-b border-white/10 last:border-0">
              <div className="flex flex-wrap items-start gap-3 px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] font-mono text-xs font-bold text-gold">
                  {initials}
                </span>

                <div className="min-w-0 flex-1 basis-48">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                    <span className="truncate">{m.name}</span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        m.role === "admin" ? "border-gold/50 text-gold" : "border-white/20 text-white/60"
                      }`}
                    >
                      {m.role}
                    </span>
                    {isMe && <span className="text-xs font-normal text-white/40">you</span>}
                    {requested && <span className="chip-amber">Reset requested</span>}
                    {pending && !requested && <span className="chip-amber">First sign-in pending</span>}
                  </p>
                  <p className="font-mono text-xs text-white/45">{m.username}</p>

                  <p className="mt-1.5 flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.active ? "animate-pulse bg-green-400" : "bg-white/25"}`} />
                    {a.active ? (
                      <span className="text-green-300">
                        Active now
                        <span className="text-white/60">
                          {" · "}
                          {a.app === "admin" ? "Admin site" : "Scanner site"}
                          {a.page ? ` · ${a.page}` : ""}
                          {a.event ? ` · ${a.event}` : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="text-white/50">
                        {a.lastSeen ? `Offline · last seen ${formatAgo(a.lastSeen, now)}` : "Has not signed in yet"}
                      </span>
                    )}
                  </p>
                  {a.lastSeen && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                      <FiSmartphone size={11} className="shrink-0" /> <span className="truncate">{a.device || "Unknown device"}</span>
                    </p>
                  )}
                </div>

                {canManage && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleRole(m, e.target.value)}
                      disabled={busyUid === m.uid}
                      aria-label={`Role for ${m.name}`}
                      className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-xs text-white focus:border-gold/60 focus:outline-none"
                    >
                      <option value="admin" className="bg-[#1c1011]">Admin</option>
                      <option value="scanner" className="bg-[#1c1011]">Scanner</option>
                      <option value="student" className="bg-[#1c1011]">Student</option>
                    </select>
                    <button type="button" onClick={() => handleIssue(m)} disabled={busyUid === m.uid} className="btn-ghost btn-sm">
                      <FiRefreshCw size={12} /> {busyUid === m.uid ? "Working..." : "New password"}
                    </button>
                    <button type="button" onClick={() => handleRemove(m)} disabled={busyUid === m.uid} className="btn-danger btn-sm" aria-label={`Remove ${m.name}`}>
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {(pending || requested) && canManage && (
                <div className="space-y-2 px-4 pb-3.5">
                  {requested && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2">
                      <p className="flex-1 text-sm font-semibold text-gold">{m.name} asked for a new temporary password.</p>
                      <button type="button" onClick={() => handleIssue(m)} className="btn-primary btn-sm">Issue password</button>
                      <button type="button" onClick={() => dismissRequest(m)} className="btn-ghost btn-sm">Dismiss</button>
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
        Activity updates about every 30 seconds. New accounts use the same details as a student record, and the
        ID number is the username they sign in with.
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
          Data: Supabase Postgres, through the OASIS API
        </p>
      </div>
    </Section>
  );
}

const TABS = [
  { id: "account", label: "My account" },
  { id: "staff", label: "Staff" },
  { id: "points", label: "Points" },
  { id: "system", label: "System" },
];

export default function SettingsPage({ currentUser, onUserChange }) {
  const { staff } = useStaff();
  const [tab, setTab] = useState("account");
  const requests = staff.filter((m) => m.passwordRequestedAt).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Your account, the staff accounts, and how the system works." />

      <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1" role="tablist" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t.id ? "bg-gold/15 text-gold" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
            {t.id === "staff" && requests > 0 && (
              <span
                className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-black"
                title="Password requests waiting"
              >
                {requests}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "account" && <MyAccountTab user={currentUser} onUserChange={onUserChange} />}
      {tab === "staff" && <StaffAccounts user={currentUser} />}
      {tab === "points" && <PointsTab />}
      {tab === "system" && <SystemInfo />}
    </div>
  );
}
