import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiUserCheck,
  FiUserX,
  FiMonitor,
} from "react-icons/fi";
import { useStudents } from "../context/StudentsContext";
import { useEvents, useEventAttendance, scanEventAttendance } from "../context/EventsContext";
import CreateEventModal from "../components/CreateEventModal";
import {
  formatEventDate,
  getEventPhase,
  scanLockMessage,
} from "@oasis/shared/utils/events.js";
import { FiBell, FiEdit2, FiLock } from "react-icons/fi";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventDetailView({ event, onBack, onStartKiosk }) {
  const { students } = useStudents();
  const { records, markPresent, markOut, unmarkPresent } = useEventAttendance(event.id);
  const { notifyEvent } = useEvents();
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
    const confirmed = window.confirm(`Send a reminder about "${event.title}" to ${who}?`);
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
      ? "border-green-400/40 bg-green-500/15 text-green-200"
      : feedback?.type === "error"
      ? "border-red-400/40 bg-red-500/15 text-red-200"
      : "border-white/30 bg-white/10 text-white";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white transition-all hover:bg-white/15"
            aria-label="Back to events"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">
              {event.title}
            </h2>
            <p className="text-xs text-white/60">
              {formatEventDate(event.date)} {event.description ? `· ${event.description}` : ""} ·{" "}
              {event.pointValue} pts · {isRestricted ? event.programFilter : "All Programs"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/5 px-5 text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiEdit2 size={15} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleNotify}
            disabled={notifying || phase === "done"}
            title={phase === "done" ? "This event is over" : "Remind the students required to attend"}
            className="flex h-11 items-center gap-2 rounded-full border border-white/40 bg-white/5 px-5 text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiBell size={15} />
            {notifying ? "Sending..." : "Notify students"}
          </button>
          <button
            type="button"
            onClick={() => onStartKiosk?.(event.id)}
            disabled={scanLocked}
            title={scanLocked ? lockMessage : undefined}
            className="flex h-11 items-center gap-2 rounded-full bg-white/90 px-6 text-sm font-bold uppercase tracking-[1px] text-[#7a1317] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/90"
          >
            <FiMonitor size={16} />
            Launch Kiosk Mode
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${
            notice.type === "success"
              ? "border-green-400/40 bg-green-500/10 text-green-200"
              : "border-red-400/40 bg-red-500/10 text-red-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {event.lastNotifiedAt?.toDate && (
        <p className="-mt-3 text-xs text-white/45">
          Students last notified{" "}
          {event.lastNotifiedAt.toDate().toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      )}

      {scanLocked && (
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 px-5 py-3 text-sm font-semibold text-yellow-200">
          <FiLock size={16} className="shrink-0" />
          {lockMessage}
        </div>
      )}

      <p className="text-xs text-white/50">
        Kiosk Mode opens a private, student-facing check-in screen that only shows the
        scanning student's own name — no other students are visible. Use this table below
        for your own admin view.
      </p>

      {/* Fast check-in */}
      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[2px] text-white/70">
          Tap / Scan Student ID (Admin View)
        </label>
        <input
          ref={inputRef}
          type="text"
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCheckIn(scanValue);
          }}
          disabled={scanLocked}
          placeholder={scanLocked ? "Scanning is locked" : "Enter student ID and press Enter"}
          className="h-14 w-full rounded-xl border border-white/30 bg-black/30 px-5 text-lg text-white placeholder-white/40 outline-none focus:border-white/60 disabled:cursor-not-allowed disabled:opacity-40"
        />
        {feedback && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${feedbackClass}`}
          >
            <FiCheck size={16} />
            {feedback.message}
          </div>
        )}
        <p className="mt-3 text-sm font-bold uppercase tracking-[1px] text-white/70">
          Present: <span className="text-white">{presentCount}</span> /{" "}
          {eligibleStudents.length}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student ID or name"
          className="h-11 w-full max-w-xs rounded-full border border-white/30 bg-white/10 px-5 text-sm text-white placeholder-white/50 outline-none backdrop-blur-md"
        />
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="h-11 rounded-full border border-white/30 bg-white/10 px-4 text-sm text-white backdrop-blur-md"
        >
          <option className="text-black" value="ALL">
            All Sections
          </option>
          {sections.map((s) => (
            <option key={s} className="text-black" value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Roster */}
      <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="bg-[#7a1317]/70">
                {[
                  "Student ID",
                  "Name",
                  "Program",
                  "Section",
                  "Status",
                  "Time In",
                  "Time Out",
                  "",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-sm font-bold uppercase tracking-[2px] text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-white/60">
                    No students found.
                  </td>
                </tr>
              )}
              {filteredStudents.map((student, i) => {
                const record = records[student.studentId];
                const isCheckedIn = Boolean(record);
                const isCheckedOut = Boolean(record?.timeOut);
                return (
                  <tr
                    key={student.studentId}
                    className={`border-b border-dashed border-white/20 last:border-none ${
                      isCheckedIn ? "bg-green-500/10" : i % 2 === 0 ? "bg-white/10" : "bg-white/5"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/90">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-white/90">{student.course}</td>
                    <td className="px-6 py-4 text-sm text-white/90">{student.section}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[1px] ${
                          isCheckedOut
                            ? "bg-blue-500/20 text-blue-300"
                            : isCheckedIn
                            ? "bg-green-500/20 text-green-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Absent"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {record ? formatTime(record.timeIn) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/70">
                      {record?.timeOut ? formatTime(record.timeOut) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {!isCheckedIn && (
                          <button
                            type="button"
                            onClick={() => markPresent(student.studentId)}
                            disabled={manualLocked}
                            className="flex items-center gap-1 disabled:pointer-events-none disabled:opacity-40 rounded-full border border-green-400/40 bg-green-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[1px] text-green-300 transition-all hover:bg-green-500/20"
                          >
                            <FiUserCheck size={14} /> In
                          </button>
                        )}
                        {isCheckedIn && !isCheckedOut && (
                          <button
                            type="button"
                            onClick={() => markOut(student.studentId)}
                            disabled={manualLocked}
                            className="flex items-center gap-1 disabled:pointer-events-none disabled:opacity-40 rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[1px] text-blue-300 transition-all hover:bg-blue-500/20"
                          >
                            <FiUserCheck size={14} /> Out
                          </button>
                        )}
                        {isCheckedIn && (
                          <button
                            type="button"
                            onClick={() => unmarkPresent(student.studentId)}
                            disabled={manualLocked}
                            className="flex items-center gap-1 disabled:pointer-events-none disabled:opacity-40 rounded-full border border-white/30 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
                          >
                            <FiUserX size={14} /> Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showEdit && (
        <CreateEventModal event={event} onClose={() => setShowEdit(false)} onCreated={() => setShowEdit(false)} />
      )}
    </div>
  );
}
