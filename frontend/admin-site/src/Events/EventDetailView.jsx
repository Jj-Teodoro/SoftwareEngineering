import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiBell, FiCheck, FiEdit2, FiLock, FiMonitor, FiUserCheck, FiUserX } from "react-icons/fi";
import { useConfirm } from "@oasis/shared/components/ConfirmDialog.jsx";
import { EmptyState, Section } from "@oasis/shared/components/ui.jsx";
import { formatEventDate, getEventPhase, scanLockMessage } from "@oasis/shared/utils/events.js";
import { useStudents } from "../context/StudentsContext";
import { useEvents, useEventAttendance, scanEventAttendance } from "../context/EventsContext";
import CreateEventModal from "../components/CreateEventModal";

// One grid for header and rows: a card on phones, a table row from md up.
const ROW =
  "grid grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_112px_92px_minmax(0,1.3fr)]";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EventDetailView({ event, onBack, onStartKiosk }) {
  const { students } = useStudents();
  const { records, markPresent, markOut, unmarkPresent } = useEventAttendance(event.id);
  const { notifyEvent } = useEvents();
  const confirm = useConfirm();
  const [showEdit, setShowEdit] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notice, setNotice] = useState(null);

  const [scanValue, setScanValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [section, setSection] = useState("ALL");
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  const isRestricted = event.programFilter && event.programFilter !== "ALL";

  // Scanning only works on the event's own date; manual corrections stay
  // available afterwards but not before the event has started.
  const phase = getEventPhase(event);
  const scanLocked = phase !== "today";
  const manualLocked = phase === "upcoming";
  const lockMessage = scanLockMessage(event);

  useEffect(() => {
    if (!scanLocked) inputRef.current?.focus();
  }, [scanLocked]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const eligibleStudents = useMemo(
    () =>
      isRestricted ? students.filter((s) => s.course === event.programFilter) : students,
    [students, isRestricted, event.programFilter]
  );

  const sections = useMemo(
    () => [...new Set(eligibleStudents.map((s) => s.section))].sort(),
    [eligibleStudents]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return eligibleStudents.filter((s) => {
      const matchesSection = section === "ALL" || s.section === section;
      const matchesQuery =
        !query ||
        s.studentId.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query);
      return matchesSection && matchesQuery;
    });
  }, [eligibleStudents, section, search]);

  const presentCount = Object.keys(records).length;

  const handleNotify = async () => {
    const count = eligibleStudents.length;
    const who = isRestricted
      ? `${count} ${event.programFilter} student${count === 1 ? "" : "s"}`
      : `all ${count} student${count === 1 ? "" : "s"}`;
    const confirmed = await confirm({
      title: "Send reminder",
      message: `Send a reminder about "${event.title}" to ${who}?`,
      confirmLabel: "Send",
    });
    if (!confirmed) return;
    setNotifying(true);
    const result = await notifyEvent(event.id, "reminder");
    setNotifying(false);
    setNotice(
      result.ok
        ? { type: "success", text: `Reminder sent to ${who}.` }
        : { type: "error", text: result.message }
    );
  };

  const handleCheckIn = async (rawId) => {
    const id = rawId.trim();
    if (!id || scanLocked) return;

    const student = students.find(
      (s) => s.studentId.toLowerCase() === id.toLowerCase()
    );

    if (!student) {
      setFeedback({ type: "error", message: `No student found with ID "${id}".` });
      setScanValue("");
      return;
    }

    if (isRestricted && student.course !== event.programFilter) {
      setFeedback({
        type: "error",
        message: `This event is only for ${event.programFilter} students.`,
      });
      setScanValue("");
      return;
    }

    const { action, record } = await scanEventAttendance(event.id, student.studentId);

    if (action === "in") {
      setFeedback({
        type: "success",
        message: `Checked IN: ${student.name} (${student.section})`,
      });
    } else if (action === "out") {
      setFeedback({
        type: "success",
        message: `Checked OUT: ${student.name} (${student.section})`,
      });
    } else {
      setFeedback({
        type: "info",
        message: `${student.name} already checked in at ${formatTime(
          record.timeIn
        )} and out at ${formatTime(record.timeOut)}.`,
      });
    }
    setScanValue("");
  };

  const feedbackClass =
    feedback?.type === "success"
      ? "border-green-400/30 bg-green-500/10 text-green-200"
      : feedback?.type === "error"
      ? "border-red-400/30 bg-red-500/10 text-red-200"
      : "border-white/20 bg-white/5 text-white";

  const rowAction = (onClick, tone, Icon, label) => (
    <button type="button" onClick={onClick} disabled={manualLocked} className={`btn-sm ${tone}`}>
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button type="button" onClick={onBack} className="btn-icon mt-0.5" aria-label="Back to events">
            <FiArrowLeft size={17} />
          </button>
          <div className="min-w-0">
            <h1 className="page-title">{event.title}</h1>
            <p className="mt-1 text-sm muted">
              {formatEventDate(event.date)} · {event.pointValue} pts · {isRestricted ? event.programFilter : "All programs"}
            </p>
            {event.description && <p className="mt-1 max-w-2xl text-sm text-white/60">{event.description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowEdit(true)} className="btn-ghost">
            <FiEdit2 size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={handleNotify}
            disabled={notifying || phase === "done"}
            title={phase === "done" ? "This event is over" : "Remind the students required to attend"}
            className="btn-ghost"
          >
            <FiBell size={14} /> {notifying ? "Sending..." : "Notify students"}
          </button>
          <button
            type="button"
            onClick={() => onStartKiosk?.(event.id)}
            disabled={scanLocked}
            title={scanLocked ? lockMessage : undefined}
            className="btn-primary"
          >
            <FiMonitor size={15} /> Launch kiosk
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-green-400/30 bg-green-500/10 text-green-200"
              : "border-red-400/30 bg-red-500/10 text-red-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {event.lastNotifiedAt?.toDate && (
        <p className="-mt-2 text-xs text-white/45">
          Students last notified{" "}
          {event.lastNotifiedAt.toDate().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}.
        </p>
      )}

      {scanLocked && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          <FiLock size={16} className="shrink-0" />
          {lockMessage}
        </div>
      )}

      <Section title="Check-in (admin view)">
        <input
          ref={inputRef}
          type="text"
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCheckIn(scanValue);
          }}
          disabled={scanLocked}
          placeholder={scanLocked ? "Scanning is locked" : "Tap / scan a student ID, then press Enter"}
          className="input h-12 font-mono text-base"
        />
        {feedback && (
          <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${feedbackClass}`}>
            <FiCheck size={15} className="shrink-0" />
            {feedback.message}
          </div>
        )}
        <p className="label mt-3">
          Present <span className="text-white">{presentCount}</span> / {eligibleStudents.length}
          <span className="ml-3 normal-case tracking-normal text-white/40">
            The kiosk shows students only their own name; this table is for you.
          </span>
        </p>
      </Section>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student ID or name"
          className="input min-w-[200px] flex-1 sm:max-w-xs"
        />
        <select value={section} onChange={(e) => setSection(e.target.value)} className="input w-auto">
          <option className="text-black" value="ALL">All sections</option>
          {sections.map((s) => (
            <option key={s} className="text-black" value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="surface overflow-hidden">
        <div className={`${ROW} hidden border-b border-white/10 bg-white/[0.03] md:grid`}>
          {["Student", "Program", "Status", "Time", ""].map((h, i) => (
            <span key={i} className="label">{h}</span>
          ))}
        </div>

        {filteredStudents.length === 0 && <EmptyState>No students found.</EmptyState>}

        {filteredStudents.map((student) => {
          const record = records[student.studentId];
          const isCheckedIn = Boolean(record);
          const isCheckedOut = Boolean(record?.timeOut);
          return (
            <div
              key={student.studentId}
              className={`${ROW} border-b border-white/10 last:border-0 ${isCheckedIn ? "bg-green-500/[0.06]" : ""}`}
            >
              <div className="col-span-2 min-w-0 md:col-span-1">
                <p className="truncate text-sm font-semibold">{student.name}</p>
                <p className="font-mono text-xs text-white/45">{student.studentId} · {student.section}</p>
              </div>
              <p className="truncate text-xs muted">{student.course}</p>
              <div>
                <span className={isCheckedOut ? "chip-cyan" : isCheckedIn ? "chip-green" : "chip-gray"}>
                  {isCheckedOut ? "Out" : isCheckedIn ? "In" : "Absent"}
                </span>
              </div>
              <p className="col-span-2 font-mono text-xs text-white/65 md:col-span-1">
                {record ? formatTime(record.timeIn) : "—"}
                {record?.timeOut ? ` → ${formatTime(record.timeOut)}` : ""}
              </p>
              <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1">
                {!isCheckedIn && rowAction(() => markPresent(student.studentId), "btn-ghost text-green-300", FiUserCheck, "In")}
                {isCheckedIn && !isCheckedOut && rowAction(() => markOut(student.studentId), "btn-ghost text-neon-cyan", FiUserCheck, "Out")}
                {isCheckedIn && rowAction(() => unmarkPresent(student.studentId), "btn-ghost", FiUserX, "Reset")}
              </div>
            </div>
          );
        })}
      </div>

      {showEdit && (
        <CreateEventModal event={event} onClose={() => setShowEdit(false)} onCreated={() => setShowEdit(false)} />
      )}
    </div>
  );
}
