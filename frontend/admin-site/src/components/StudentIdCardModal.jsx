import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { FiCheckCircle, FiCopy, FiEdit2, FiKey, FiRefreshCw, FiTrash2, FiXCircle } from "react-icons/fi";
import { db } from "@oasis/shared/firebaseClient.js";
import StudentIdCard from "@oasis/shared/components/StudentIdCard.jsx";
import { useConfirm } from "@oasis/shared/components/ConfirmDialog.jsx";
import Modal from "./Modal";
import { useStudents } from "../context/StudentsContext";
import { useRequirements } from "../context/RequirementsContext";
import { useEvents } from "../context/EventsContext";
import { usePoints } from "../context/PointsContext";
import { formatAgo, usePresence } from "../context/PresenceContext";

const TABS = [
  { id: "id", label: "ID" },
  { id: "info", label: "Info" },
  { id: "status", label: "Status" },
  { id: "account", label: "Account" },
];

const inputClass =
  "h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/50 disabled:opacity-50";

export default function StudentIdCardModal({ studentId, onClose }) {
  const { students, deleteStudents } = useStudents();
  const { getClearance } = usePoints();
  const confirm = useConfirm();
  const [tab, setTab] = useState("id");
  const [deleting, setDeleting] = useState(false);

  const student = students.find((s) => s.studentId === studentId);
  if (!student) return null;

  const { totalPoints, targetPoints, cleared } = getClearance(student.studentId);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete student",
      message: `Delete ${student.name}? Their record, attendance, requirement progress and pending login are removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    setDeleting(true);
    await deleteStudents([student.studentId]);
    onClose();
  };

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="mb-4 flex rounded-full border border-white/20 bg-black/20 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-[1px] transition-all ${
              tab === t.id ? "bg-[#97191d] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "id" && (
        <StudentIdCard
          student={student}
          totalPoints={totalPoints}
          targetPoints={targetPoints}
          cleared={cleared}
        />
      )}
      {tab === "info" && <StudentInfoTab student={student} />}
      {tab === "status" && (
        <div className="-mx-6 sm:-mx-8">
          <StudentStatusTab student={student} />
        </div>
      )}
      {tab === "account" && <StudentAccountTab student={student} />}

      <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 rounded-full border border-red-400/50 px-5 py-2 text-[11px] font-bold uppercase tracking-[1px] text-red-300 transition-all hover:bg-red-600 hover:text-white disabled:opacity-50"
        >
          <FiTrash2 size={13} /> {deleting ? "Deleting..." : "Delete student"}
        </button>
      </div>
    </Modal>
  );
}

function StudentInfoTab({ student }) {
  const { updateStudent } = useStudents();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hasAccount = Boolean(student.authUid);

  const startEditing = () => {
    setForm({
      name: student.name || "",
      course: student.course || "",
      yearLevel: student.yearLevel || "",
      section: student.section || "",
      email: student.email || "",
      contactNumber: student.contactNumber || "",
      address: student.address || "",
    });
    setError("");
    setEditing(true);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const result = await updateStudent(student.studentId, form);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
        <DetailRow label="Student No." value={student.studentId} />
        <DetailRow label="Name" value={student.name} />
        <DetailRow label="Course" value={student.course} />
        <DetailRow label="Year Level" value={student.yearLevel} />
        <DetailRow label="Section" value={student.section} />
        <DetailRow label="Email" value={student.email} />
        <DetailRow label="Contact No." value={student.contactNumber} />
        <DetailRow label="Address" value={student.address} />
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <p className="text-[11px] text-white/50">
            Photo, bio, talent and hobbies are edited by the student.
          </p>
          <button
            type="button"
            onClick={startEditing}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/10"
          >
            <FiEdit2 size={13} /> Edit info
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
      <FormRow label="Student No.">
        <input value={student.studentId} disabled className={inputClass} />
      </FormRow>
      <FormRow label="Name">
        <input value={form.name} onChange={set("name")} className={inputClass} />
      </FormRow>
      <FormRow label="Course">
        <input value={form.course} onChange={set("course")} className={inputClass} />
      </FormRow>
      <FormRow label="Year Level">
        <select value={form.yearLevel} onChange={set("yearLevel")} className={inputClass}>
          {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
            <option key={y} value={y} className="text-black">
              {y}
            </option>
          ))}
        </select>
      </FormRow>
      <FormRow label="Section">
        <input value={form.section} onChange={set("section")} className={inputClass} />
      </FormRow>
      <FormRow label="Email">
        <input
          value={form.email}
          onChange={set("email")}
          disabled={hasAccount}
          className={inputClass}
        />
      </FormRow>
      <FormRow label="Contact No.">
        <input value={form.contactNumber} onChange={set("contactNumber")} className={inputClass} />
      </FormRow>
      <FormRow label="Address">
        <input value={form.address} onChange={set("address")} className={inputClass} />
      </FormRow>
      {hasAccount && (
        <p className="text-[11px] text-white/50">
          The email is locked because it is this student's login.
        </p>
      )}
      {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-white/30 px-5 py-2 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-[#97191d] px-5 py-2 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-[#b81f25] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div className="grid items-center gap-1 sm:grid-cols-[110px_1fr] sm:gap-3">
      <span className="text-[11px] font-bold uppercase tracking-[1px] text-white/50">{label}</span>
      {children}
    </div>
  );
}

function StudentAccountTab({ student }) {
  const { provisionAccount, issueTempPassword, dismissRequest, resetRequests } = useStudents();
  const confirm = useConfirm();
  const { getActivity, now } = usePresence();
  const activity = getActivity(student.studentId);
  const [busy, setBusy] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stored, setStored] = useState(undefined);

  const pending = Boolean(student.authUid) && Boolean(student.mustChangePassword);

  useEffect(() => {
    if (!pending) {
      setStored(undefined);
      return undefined;
    }
    return onSnapshot(
      doc(db, "accountCredentials", student.studentId),
      (snap) => setStored(snap.exists() ? snap.data().tempPassword : null),
      () => setStored(null)
    );
  }, [pending, student.studentId]);

  const tempPassword = result?.ok ? result.tempPassword : stored;

  const handleCreate = async () => {
    setBusy(true);
    setResult(await provisionAccount(student.studentId));
    setBusy(false);
  };

  const handleRegenerate = async () => {
    const confirmed = await confirm({
      title: "New temporary password",
      message: "Generate a new temporary password? The current one will stop working.",
      confirmLabel: "Generate",
    });
    if (!confirmed) return;
    setRegenerating(true);
    setResult(await issueTempPassword(student.studentId));
    setRegenerating(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the password stays visible to copy by hand
    }
  };

  const handleIssue = async () => {
    const confirmed = await confirm({
      title: "Issue temporary password",
      message:
        "Issue a new temporary password? The student's current password will stop working and they will have to choose a new one.",
      confirmLabel: "Issue",
    });
    if (!confirmed) return;
    setRegenerating(true);
    setResult(await issueTempPassword(student.studentId));
    setRegenerating(false);
  };

  const hasAccount = Boolean(student.authUid);
  const requested = Boolean(resetRequests[student.studentId]);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-5">
      <div className="flex items-center gap-3">
        <FiKey className="text-white/70" size={18} />
        <div>
          <p className="text-sm font-bold uppercase tracking-[1px] text-white">
            {!hasAccount
              ? "No account yet"
              : student.mustChangePassword
              ? "Account created — waiting for first login"
              : "Account active"}
          </p>
          <p className="text-xs text-white/60">
            Login email: {student.email || "— none on file —"}
          </p>
          {hasAccount && (
            <p className="mt-1 text-xs text-white/60">
              {activity.online
                ? "Using the website right now"
                : activity.lastSeen
                ? `Last on the website ${formatAgo(activity.lastSeen, now)}`
                : "Has not logged in yet"}
              {activity.atEvent ? ` · scanned in at ${activity.eventTitle || "an event"}` : ""}
            </p>
          )}
        </div>
      </div>

      {requested && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f2b400]/60 bg-[#f2b400]/10 px-4 py-3">
          <p className="flex-1 text-sm font-semibold text-[#f2b400]">
            This student requested a new temporary password.
          </p>
          <button
            type="button"
            onClick={handleIssue}
            disabled={regenerating}
            className="rounded-full bg-[#f2b400] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-black hover:brightness-110 disabled:opacity-50"
          >
            {regenerating ? "Issuing..." : "Issue password"}
          </button>
          <button
            type="button"
            onClick={() => dismissRequest(student.studentId)}
            className="rounded-full border border-white/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[1px] text-white hover:bg-white/10"
          >
            Dismiss
          </button>
        </div>
      )}

      {pending && (
        <div className="space-y-2 rounded-xl border border-[#f2b400]/60 bg-[#f2b400]/10 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#f2b400]">
            Give these to the student — visible until they set their own password
          </p>
          <p className="text-sm text-white">
            Email: <span className="font-semibold">{student.email}</span>
          </p>
          {tempPassword ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-white">
                Temporary password:{" "}
                <span className="select-all font-mono text-base font-bold tracking-[2px]">
                  {tempPassword}
                </span>
              </p>
              <button
                type="button"
                onClick={copyPassword}
                className="flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[1px] text-white hover:bg-white/10"
              >
                <FiCopy size={12} /> {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[1px] text-white hover:bg-white/10 disabled:opacity-50"
              >
                <FiRefreshCw size={12} /> {regenerating ? "Generating..." : "New password"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/70">
              {stored === undefined
                ? "Loading..."
                : "The temporary password isn't available. Use the button below to issue a new one."}
            </p>
          )}
        </div>
      )}
      {result && !result.ok && (
        <p className="text-xs font-semibold text-red-300">{result.message}</p>
      )}

      {!hasAccount ? (
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="rounded-full bg-[#97191d] px-6 py-2.5 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
        >
          {busy ? "Creating..." : "Create account"}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-white/60">
            {student.mustChangePassword
              ? "The student will be asked to choose their own password the first time they log in. If they lose the temporary one, generate a new one. Once they set their own, it disappears from here."
              : "The student chose their own password; admins can't see it. If they forget it, they request a temporary password from the login page and you issue one here."}
          </p>
          {!student.mustChangePassword && (
            <button
              type="button"
              onClick={handleIssue}
              disabled={regenerating}
              className="flex items-center gap-1 rounded-full border border-white/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[1px] text-white hover:bg-white/10 disabled:opacity-50"
            >
              <FiRefreshCw size={12} /> {regenerating ? "Issuing..." : "Issue new temporary password"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StudentStatusTab({ student }) {
  const { items, appliesTo, isCompleted } = useRequirements();
  const { events } = useEvents();
  const { getClearance, getAttendanceRecords } = usePoints();

  const { totalPoints, targetPoints, cleared } = getClearance(student.studentId);
  const attendanceRecords = getAttendanceRecords(student.studentId);
  const applicable = items.filter((item) => appliesTo(item, student.course));

  return (
    <div className="mx-6 mb-6 space-y-5">
      {/* Clearance summary */}
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          cleared
            ? "border-green-400/40 bg-green-500/15 text-green-200"
            : "border-yellow-400/40 bg-yellow-500/15 text-yellow-200"
        }`}
      >
        {cleared ? <FiCheckCircle size={20} /> : <FiXCircle size={20} />}
        <div>
          <p className="text-sm font-bold uppercase tracking-[1px]">
            {cleared ? "Cleared" : "Pending Clearance"}
          </p>
          <p className="text-xs opacity-80">
            {totalPoints} of {targetPoints} points earned
          </p>
        </div>
      </div>

      {/* Requirements (read-only; managed in the Requirements tab) */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/70">
          Requirements
        </p>
        {applicable.length === 0 ? (
          <p className="text-sm text-white/50">No requirements apply to this student.</p>
        ) : (
          <div className="space-y-2">
            {applicable.map((item) => {
              const completed = isCompleted(student.studentId, item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                    completed
                      ? "border-green-400/40 bg-green-500/10 text-green-200"
                      : "border-white/15 bg-black/20 text-white/70"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {completed ? <FiCheckCircle size={15} /> : <FiXCircle size={15} className="opacity-50" />}
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-[1px]">
                    {completed ? `+${item.pointValue}` : item.pointValue} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-[11px] text-white/45">
          Add, edit or remove requirements, and mark who completed them, in the Requirements tab.
        </p>
      </div>

      {/* Attendance history */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/70">
          Attendance History
        </p>
        {attendanceRecords.length === 0 ? (
          <p className="text-sm text-white/50">No attendance records yet.</p>
        ) : (
          <div className="space-y-2">
            {attendanceRecords.map((record) => {
              const event = events.find((e) => e.id === record.eventId);
              return (
                <div
                  key={record.eventId}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {event?.title || "Unknown Event"}
                    </p>
                    <p className="text-xs text-white/50">{event?.date}</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[1px] text-green-300">
                    +{record.pointValue || 0} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[1px] text-white/50">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words text-right text-sm text-white">
        {value}
      </span>
    </div>
  );
}
