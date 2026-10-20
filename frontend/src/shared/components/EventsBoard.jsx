import { useMemo } from "react";
import { FiAward, FiCalendar, FiCheckCircle, FiLock, FiPlus, FiTrash2, FiUsers, FiZap } from "react-icons/fi";
import { daysUntil, formatEventDate, getEventPhase, todayLocal } from "../utils/events.js";
import { EmptyState, PageHeader } from "./ui.jsx";

function PhaseChip({ event, today }) {
  const phase = getEventPhase(event, today);
  if (phase === "today") {
    return <span className="chip-green"><FiZap size={11} /> Scanning open</span>;
  }
  if (phase === "upcoming") {
    const days = daysUntil(event.date, today);
    return (
      <span className="chip-amber">
        <FiLock size={11} /> {days === 1 ? "Opens tomorrow" : `Opens in ${days} days`}
      </span>
    );
  }
  return <span className="chip-gray"><FiCheckCircle size={11} /> Done</span>;
}

function EventCard({ event, today, eligible, present, onOpen, onDelete }) {
  const restricted = event.programFilter && event.programFilter !== "ALL";
  const done = getEventPhase(event, today) === "done";
  return (
    <article className={`surface flex flex-col overflow-hidden ${done ? "opacity-80" : ""}`}>
      {event.image && <img src={event.image} alt="" className="h-32 w-full object-cover" />}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <PhaseChip event={event} today={today} />
          <span className="chip-amber"><FiAward size={11} /> {event.pointValue} pts</span>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wide">{event.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-xs muted">
          <FiCalendar size={12} /> {formatEventDate(event.date)}
        </p>
        {event.description && <p className="mt-2 line-clamp-3 text-sm text-white/70">{event.description}</p>}
        <p className="label mt-3">{restricted ? event.programFilter : "All programs"}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
          <FiUsers size={14} /> {present} / {eligible} present
        </p>

        <div className="mt-auto flex gap-2 pt-4">
          {onOpen && <button type="button" onClick={onOpen} className="btn-primary flex-1">Open</button>}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn-icon h-10 w-10 hover:border-red-400/50 hover:text-red-300"
              aria-label={`Delete ${event.title}`}
            >
              <FiTrash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Events grouped as Today / Upcoming / Done. The host supplies the data and
 * actions: onCreate for the New Event button, onOpen / onDelete per card.
 */
export default function EventsBoard({ events, students, presentCounts, onCreate, onOpen, onDelete }) {
  const today = todayLocal();

  const sections = useMemo(() => {
    const byDate = (a, b) => a.date.localeCompare(b.date);
    const inPhase = (phase) => events.filter((e) => getEventPhase(e, today) === phase);
    return [
      { key: "today", title: "Happening today", hint: "Scanning is open", list: inPhase("today") },
      { key: "upcoming", title: "Upcoming", hint: "Scanning opens on the event date", list: inPhase("upcoming").sort(byDate) },
      { key: "done", title: "Done", hint: "Scanning is closed", list: inPhase("done").sort((a, b) => byDate(b, a)) },
    ].filter((s) => s.list.length > 0);
  }, [events, today]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Events" subtitle={`${events.length} in total`}>
        <button type="button" onClick={onCreate} className="btn-primary">
          <FiPlus size={14} /> New event
        </button>
      </PageHeader>

      {events.length === 0 && (
        <div className="surface">
          <EmptyState>No events yet. Create one to start taking attendance.</EmptyState>
        </div>
      )}

      {sections.map((section) => (
        <section key={section.key}>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
            <h2 className="label text-white/80">
              {section.title} <span className="ml-1 text-gold">{section.list.length}</span>
            </h2>
            <p className="text-xs text-white/40">{section.hint}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.list.map((event) => {
              const restricted = event.programFilter && event.programFilter !== "ALL";
              const eligible = restricted ? students.filter((s) => s.course === event.programFilter).length : students.length;
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  today={today}
                  eligible={eligible}
                  present={presentCounts[event.id] ?? 0}
                  onOpen={onOpen && (() => onOpen(event))}
                  onDelete={onDelete && (() => onDelete(event))}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
