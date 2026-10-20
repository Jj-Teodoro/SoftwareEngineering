import { useMemo, useState } from "react";
import { FiAward, FiCalendar, FiCheckCircle, FiLock, FiMonitor, FiUsers } from "react-icons/fi";
import { formatEventDate, getEventPhase, scanLockMessage, todayLocal } from "../utils/events.js";
import { EmptyState, PageHeader } from "./ui.jsx";

const PHASE_ORDER = { today: 0, upcoming: 1, done: 2 };

/** Pick an event that is open today and launch the student kiosk for it. */
export default function ScanPicker({ events, students, presentCounts, onStartKiosk, exitPassword }) {
  const [selectedId, setSelectedId] = useState("");
  const today = todayLocal();

  const ordered = useMemo(
    () =>
      [...events].sort((a, b) => {
        const pa = PHASE_ORDER[getEventPhase(a, today)];
        const pb = PHASE_ORDER[getEventPhase(b, today)];
        if (pa !== pb) return pa - pb;
        return getEventPhase(a, today) === "done" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
      }),
    [events, today]
  );

  const openCount = ordered.filter((e) => getEventPhase(e, today) === "today").length;
  const selected = ordered.find((e) => e.id === selectedId);
  const selectedOpen = selected && getEventPhase(selected, today) === "today";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Scan" subtitle={events.length > 0 ? `${openCount} open today` : undefined} />

      {events.length === 0 ? (
        <div className="surface"><EmptyState>No events yet. Create one from the Events tab first.</EmptyState></div>
      ) : (
        <>
          {openCount === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              <FiLock size={16} className="shrink-0" />
              No event is open right now. Scanning unlocks on each event's date.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ordered.map((event) => {
              const phase = getEventPhase(event, today);
              const open = phase === "today";
              const restricted = event.programFilter && event.programFilter !== "ALL";
              const eligible = restricted ? students.filter((s) => s.course === event.programFilter).length : students.length;
              const isSelected = event.id === selectedId;
              return (
                <button
                  key={event.id}
                  type="button"
                  disabled={!open}
                  title={open ? undefined : scanLockMessage(event, today)}
                  onClick={() => setSelectedId(event.id)}
                  className={`surface flex flex-col items-start gap-2 p-4 text-left transition-colors ${
                    !open
                      ? "cursor-not-allowed opacity-50"
                      : isSelected
                      ? "border-gold bg-gold/10"
                      : "hover:border-white/30 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide">{event.title}</h3>
                    {isSelected ? <FiCheckCircle size={18} className="shrink-0 text-gold" /> : (
                      <span className="chip-amber shrink-0"><FiAward size={11} /> {event.pointValue} pts</span>
                    )}
                  </div>
                  <p className="flex items-center gap-1.5 font-mono text-xs muted">
                    <FiCalendar size={12} /> {formatEventDate(event.date)}
                  </p>
                  <p className="label">{restricted ? event.programFilter : "All programs"}</p>
                  {open ? (
                    <p className="flex items-center gap-2 text-sm text-white/80">
                      <FiUsers size={14} /> {presentCounts[event.id] ?? 0} / {eligible} present
                    </p>
                  ) : (
                    <p className="flex items-center gap-2 text-xs text-yellow-200/90">
                      <FiLock size={12} /> {phase === "upcoming" ? `Opens ${formatEventDate(event.date)}` : "Event ended"}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedOpen && (
        <div className="surface-accent flex flex-col items-center gap-4 p-6 text-center sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-maroon/40 text-gold">
            <FiMonitor size={26} />
          </div>
          <div>
            <p className="text-base font-bold uppercase tracking-wide">{selected.title}</p>
            <p className="mt-1 font-mono text-xs muted">
              {formatEventDate(selected.date)} · {selected.pointValue} pts ·{" "}
              {selected.programFilter && selected.programFilter !== "ALL" ? selected.programFilter : "All programs"}
            </p>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-white/55">
            Kiosk mode opens a student-facing check-in screen that shows only the scanning student's own name.
            An officer exits it with the {exitPassword} password.
          </p>
          <button type="button" onClick={() => onStartKiosk?.(selected.id)} className="btn-primary h-11 px-6">
            <FiMonitor size={16} /> Launch kiosk mode
          </button>
        </div>
      )}
    </div>
  );
}
