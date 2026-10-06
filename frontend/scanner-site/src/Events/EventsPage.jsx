import { useMemo, useState } from "react";
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiLock,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import {
  daysUntil,
  formatEventDate,
  getEventPhase,
  todayLocal,
} from "@oasis/shared/utils/events.js";
import { useEvents } from "../context/EventsContext";
import { useStudents } from "../context/StudentsContext";
import CreateEventModal from "../components/CreateEventModal";

function PhaseChip({ event, today }) {
  const phase = getEventPhase(event, today);
  if (phase === "today") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-green-300 ring-1 ring-green-400/30">
        <FiZap size={11} /> Scanning open
      </span>
    );
  }
  if (phase === "upcoming") {
    const days = daysUntil(event.date, today);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-yellow-300 ring-1 ring-yellow-400/30">
        <FiLock size={11} /> {days === 1 ? "Opens tomorrow" : `Opens in ${days} days`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] text-white/50 ring-1 ring-white/15">
      <FiCheckCircle size={11} /> Done
    </span>
  );
}

export default function EventsPage() {
  const { events, presentCounts, deleteEvent } = useEvents();
  const { students } = useStudents();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const today = todayLocal();
  const sections = useMemo(() => {
    const byDate = (x, y) => x.date.localeCompare(y.date);
    const phaseOf = (e) => getEventPhase(e, today);
    return [
      { key: "today", title: "Happening Today", hint: "Scanning is open", list: events.filter((e) => phaseOf(e) === "today") },
      { key: "upcoming", title: "Upcoming", hint: "Scanning opens on the event date", list: events.filter((e) => phaseOf(e) === "upcoming").sort(byDate) },
      { key: "done", title: "Done", hint: "Scanning is closed", list: events.filter((e) => phaseOf(e) === "done").sort((x, y) => byDate(y, x)) },
    ].filter((section) => section.list.length > 0);
  }, [events, today]);

  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Delete event "${event.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await deleteEvent(event.id);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Events</h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex h-12 items-center gap-2 rounded-full bg-white/90 px-6 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
        >
          <FiPlus size={16} />
          New Event
        </button>
      </div>

      {events.length === 0 && (
        <div className="flex min-h-[200px] w-full items-center justify-center rounded-[24px] border border-white/20 bg-white/10 text-sm text-white/60 backdrop-blur-md">
          No events yet. Create one to start scanning attendance.
        </div>
      )}

      {sections.map((section) => (
        <section key={section.key}>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
            <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
              {section.title}
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                {section.list.length}
              </span>
            </h3>
            <p className="text-xs text-white/45">{section.hint}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.list.map((event) => {
              const isRestricted = event.programFilter && event.programFilter !== "ALL";
              const eligibleCount = isRestricted
                ? students.filter((s) => s.course === event.programFilter).length
                : students.length;
              const presentCount = presentCounts[event.id] ?? 0;
              const done = getEventPhase(event, today) === "done";
              return (
                <div
                  key={event.id}
                  className={`flex flex-col justify-between rounded-[20px] border bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md ${
                    done ? "border-white/10 opacity-80" : "border-white/20"
                  }`}
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <PhaseChip event={event} today={today} />
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#97191d]/30 px-3 py-1 text-xs font-bold text-white">
                        <FiAward size={12} /> {event.pointValue} pts
                      </span>
                    </div>
                    <h3 className="text-base font-bold uppercase tracking-[1px] text-white">
                      {event.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                      <FiCalendar size={12} /> {formatEventDate(event.date)}
                    </p>
                    {event.description && (
                      <p className="mt-2 text-sm text-white/70">{event.description}</p>
                    )}
                    <p className="mt-2 text-xs font-bold uppercase tracking-[1px] text-white/50">
                      {isRestricted ? event.programFilter : "All Programs"}
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                      <FiUsers size={16} />
                      {presentCount} / {eligibleCount} present
                    </p>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(event)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white transition-all hover:bg-red-500/20"
                      aria-label={`Delete ${event.title}`}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} onCreated={() => {}} />
      )}
    </div>
  );
}
