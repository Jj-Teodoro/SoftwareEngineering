import { useMemo, useState } from "react";
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiLock,
  FiMonitor,
  FiUsers,
} from "react-icons/fi";
import {
  formatEventDate,
  getEventPhase,
  scanLockMessage,
  todayLocal,
} from "@oasis/shared/utils/events.js";
import { useEvents } from "../context/EventsContext";
import { useStudents } from "../context/StudentsContext";

const PHASE_ORDER = { today: 0, upcoming: 1, done: 2 };

export default function ScanPage({ onStartKiosk }) {
  const { events, presentCounts } = useEvents();
  const { students } = useStudents();
  const [selectedEventId, setSelectedEventId] = useState("");

  const today = todayLocal();

  const ordered = useMemo(
    () =>
      [...events].sort((a, b) => {
        const pa = PHASE_ORDER[getEventPhase(a, today)];
        const pb = PHASE_ORDER[getEventPhase(b, today)];
        if (pa !== pb) return pa - pb;
        return getEventPhase(a, today) === "done"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      }),
    [events, today]
  );

  const openCount = ordered.filter((e) => getEventPhase(e, today) === "today").length;
  const selectedEvent = ordered.find((e) => e.id === selectedEventId);
  const selectedOpen = selectedEvent && getEventPhase(selectedEvent, today) === "today";
  const isRestricted =
    selectedEvent?.programFilter && selectedEvent.programFilter !== "ALL";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Scan</h2>
        {events.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-[1px] text-white/50">
            {openCount} open today
          </p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex min-h-[280px] w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-white/20 bg-white/10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <FiCalendar size={26} className="text-white/40" />
          </div>
          <p className="text-sm text-white/60">
            No events yet — create one from the Event tab first.
          </p>
        </div>
      ) : (
        <>
          {openCount === 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-5 py-3 text-sm font-semibold text-yellow-200">
              <FiLock size={16} className="shrink-0" />
              No event is open right now. Scanning unlocks on each event's date.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((event) => {
              const phase = getEventPhase(event, today);
              const open = phase === "today";
              const restricted = event.programFilter && event.programFilter !== "ALL";
              const eligibleCount = restricted
                ? students.filter((s) => s.course === event.programFilter).length
                : students.length;
              const isSelected = event.id === selectedEventId;
              return (
                <button
                  key={event.id}
                  type="button"
                  disabled={!open}
                  title={open ? undefined : scanLockMessage(event, today)}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`flex flex-col items-start gap-3 rounded-[24px] border p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all ${
                    !open
                      ? "cursor-not-allowed border-white/10 bg-white/5 opacity-55"
                      : isSelected
                      ? "border-white/70 bg-[#97191d]/40"
                      : "border-white/20 bg-white/10 hover:bg-white/15"
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <h3 className="text-base font-bold uppercase tracking-[1px] text-white">
                      {event.title}
                    </h3>
                    {isSelected ? (
                      <FiCheckCircle size={20} className="shrink-0 text-white" />
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#97191d]/30 px-3 py-1 text-xs font-bold text-white">
                        <FiAward size={12} /> {event.pointValue} pts
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-white/60">
                    <FiCalendar size={12} /> {formatEventDate(event.date)}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[1px] text-white/50">
                    {restricted ? event.programFilter : "All Programs"}
                  </p>
                  {open ? (
                    <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
                      <FiUsers size={16} />
                      {presentCounts[event.id] ?? 0} / {eligibleCount} present
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-xs font-semibold text-yellow-200/90">
                      <FiLock size={13} />
                      {phase === "upcoming"
                        ? `Opens ${formatEventDate(event.date)}`
                        : "Event ended"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedOpen && (
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-white/20 bg-white/10 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#97191d]">
            <FiMonitor size={28} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold uppercase tracking-[1px] text-white">
              {selectedEvent.title}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {formatEventDate(selectedEvent.date)} · {selectedEvent.pointValue} pts ·{" "}
              {isRestricted ? selectedEvent.programFilter : "All Programs"}
            </p>
          </div>
          <p className="max-w-md text-xs text-white/50">
            Kiosk Mode opens a private, student-facing check-in screen that only shows
            the scanning student's own name — no other students or admin pages are
            visible until an officer exits with the admin password.
          </p>
          <button
            type="button"
            onClick={() => onStartKiosk?.(selectedEvent.id)}
            className="flex h-12 items-center gap-2 rounded-full bg-white/90 px-8 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
          >
            <FiMonitor size={16} />
            Launch Kiosk Mode
          </button>
        </div>
      )}
    </div>
  );
}
