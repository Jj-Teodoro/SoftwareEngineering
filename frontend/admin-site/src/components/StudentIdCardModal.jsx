import { useState } from "react";
import { FiCheckCircle, FiCopy, FiEdit2, FiKey, FiPlus, FiXCircle } from "react-icons/fi";
import StudentIdCard from "@oasis/shared/components/StudentIdCard.jsx";
import Modal from "./Modal";
import { useStudents } from "../context/StudentsContext";
import { useRequirements } from "../context/RequirementsContext";
import { useEvents } from "../context/EventsContext";
import { usePoints } from "../context/PointsContext";

const TABS = [
  { id: "id", label: "ID" },
  { id: "info", label: "Info" },
  { id: "status", label: "Status" },
  { id: "account", label: "Account" },
];

const inputClass =
  "h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/50 disabled:opacity-50";

export default function StudentIdCardModal({ studentId, onClose }) {
  const { students } = useStudents();
  const { getClearance } = usePoints();
  const [tab, setTab] = useState("id");

  const student = students.find((s) => s.studentId === studentId);
  if (!student) return null;

  const { totalPoints, targetPoints, cleared } = getClearance(student.studentId);

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
      status: student.status || "ACTIVE",
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
        <DetailRow label="Status" value={student.status} />
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
      <FormRow label="Status">
        <select value={form.status} onChange={set("status")} className={inputClass}>
          {["ACTIVE", "INACTIVE"].map((st) => (
            <option key={st} value={st} className="text-black">
              {st}
            </option>
          ))}
        </select>
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
  const { provisionAccount } = useStudents();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    setResult(await provisionAccount(student.studentId));
    setBusy(false);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the password stays visible to copy by hand
    }
  };

  const hasAccount = Boolean(student.authUid);

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
        </div>
      </div>

      {result?.ok && (
        <div className="space-y-2 rounded-xl border border-[#f2b400]/60 bg-[#f2b400]/10 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[1px] text-[#f2b400]">
            Give these to the student — the password is shown only once
          </p>
          <p className="text-sm text-white">
            Email: <span className="font-semibold">{result.email}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-white">
              Temporary password:{" "}
              <span className="select-all font-mono text-base font-bold tracking-[2px]">
                {result.tempPassword}
              </span>
            </p>
            <button
              type="button"
              onClick={copyPassword}
              className="flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[1px] text-white hover:bg-white/10"
            >
              <FiCopy size={12} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
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
        <p className="text-xs leading-relaxed text-white/60">
          {student.mustChangePassword
            ? "The student will be asked to choose their own password the first time they log in."
            : "The student chose their own password."}{" "}
          Admins can never view or change a student's password; if they forget it, they use
          "Forgot password" on the User site to get a reset email.
        </p>
      )}
    </div>
  );
}

function StudentStatusTab({ student }) {
  const { items, addItem, isCompleted, toggleCompleted } = useRequirements();
  const { events } = useEvents();
  const { getTotalPoints, getClearance, getAttendanceRecords } = usePoints();

  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState("10");
  const [addError, setAddError] = useState("");

  const { totalPoints, targetPoints, cleared } = getClearance(student.studentId);
  const attendanceRecords = getAttendanceRecords(student.studentId);

  const handleAddItem = async () => {
    const result = await addItem({ title: newTitle, pointValue: newPoints, programFilter: "ALL" });
    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    setNewTitle("");
    setNewPoints("10");
    setAddError("");
  };

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

      {/* Requirements */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/70">
          Requirements
        </p>
        <div className="space-y-2">
          {items.map((item) => {
            const completed = isCompleted(student.studentId, item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleCompleted(student.studentId, item.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-all ${
                  completed
                    ? "border-green-400/40 bg-green-500/10 text-green-200"
                    : "border-white/20 bg-black/20 text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{item.title}</span>
                <span className="text-xs font-bold uppercase tracking-[1px]">
                  {completed ? `+${item.pointValue} pts` : `${item.pointValue} pts`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setAddError("");
            }}
            placeholder="Add requirement (e.g. Membership Fee)"
            className="h-10 flex-1 rounded-lg border border-white/20 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/50"
          />
          <input
            type="number"
            min={0}
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
            className="h-10 w-16 rounded-lg border border-white/20 bg-black/20 px-2 text-center text-sm text-white outline-none focus:border-white/50"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20"
            aria-label="Add requirement"
          >
            <FiPlus size={16} />
          </button>
        </div>
        {addError && <p className="mt-1 text-xs font-semibold text-red-300">{addError}</p>}
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
