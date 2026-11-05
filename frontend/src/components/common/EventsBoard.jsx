import { useMemo, useState } from "react";
import { FiAward, FiCalendar, FiCheckCircle, FiLock, FiPlus, FiSearch, FiTrash2, FiUsers, FiZap } from "react-icons/fi";
import { DirectionToggle, MiniSelect, sortBy } from "./SortControls.jsx";
import { daysUntil, formatEventDate, getEventPhase, todayLocal, formatEventWhen, formatClock } from "../../utils/events.js";
import { EmptyState, PageHeader } from "./ui.jsx";
import EventBanner from "./EventBanner.jsx";
import Pagination, { usePagination } from "./Pagination.jsx";

function PhaseChip({ event, today }) {
  const phase = getEventPhase(event, today);
  if (phase === "today") {
    return <span className="chip-green"><FiZap size={11} /> Scanning open</span>;
  }
  if (phase === "upcoming" && event.date === today) {
    return <span className="chip-amber"><FiLock size={11} /> Opens at {formatClock(event.startTime)}</span>;
  }
  if (phase === "upcoming") {
    const days = daysUntil(event.date, today);
    return (
      <span className="chip-amber">
        <FiLock size={11} /> {days === 1 ? "Opens tomorrow" : `Opens in ${days} days`}
      </span>
    );
  }
  return <span className="chip-gray"><FiCheckCircle size={11} /> Closed</span>;
}

function EventCard({ event, today, eligible, present, onOpen, onDelete }) {
  const restricted = event.programFilter && event.programFilter !== "ALL";
  const done = getEventPhase(event, today) === "done";
  return (
    <article className={`surface flex flex-col overflow-hidden ${done ? "opacity-80" : ""}`}>
      <EventBanner event={event} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <PhaseChip event={event} today={today} />
          <span className="chip-amber"><FiAward size={11} /> {event.pointValue} pts</span>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wide">{event.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-xs muted">
          <FiCalendar size={12} /> {formatEventWhen(event)}
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

// One group of events (Today / Upcoming / Done), paged on its own so a long list of
// past events doesn't push everything else down.
const SORTS = [
  { value: "auto", label: "Default order" },
  { value: "date", label: "Date" },
  { value: "title", label: "Name" },
  { value: "points", label: "Points" },
  { value: "present", label: "Attendance" },
];

function EventSection({ section, today, students, presentCounts, onOpen, onDelete, resetKey }) {
  const pagination = usePagination(section.list, { initialPageSize: 6, resetKey });
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h2 className="label text-white/80">
          {section.title} <span className="ml-1 text-gold">{section.list.length}</span>
        </h2>
        <p className="text-xs text-white/40">{section.hint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pagination.pageItems.map((event) => {
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
      {section.list.length > 6 && (
        <Pagination {...pagination} itemLabel="events" pageSizeOptions={[6, 12, 24, 48]} className="mt-4" />
      )}
    </section>
  );
}

/**
 * Events grouped as Today / Upcoming / Done. The host supplies the data and
 * actions: onCreate for the New Event button, onOpen / onDelete per card.
 */
export default function EventsBoard({ events, students, presentCounts, onCreate, onOpen, onDelete }) {
  const today = todayLocal();
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("ANY");
  const [sortKey, setSortKey] = useState("auto");
  const [sortDir, setSortDir] = useState("asc");

  const programs = useMemo(
    () => [...new Set(events.map((e) => e.programFilter).filter((p) => p && p !== "ALL"))].sort(),
    [events]
  );

  // search and program filter first; then each group is sorted (or keeps its default order)
  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q) && !(e.description || "").toLowerCase().includes(q)) return false;
      if (program === "ANY") return true;
      const forProgram = e.programFilter && e.programFilter !== "ALL" ? e.programFilter : "ALL";
      return forProgram === program;
    });
  }, [events, query, program]);

  const sections = useMemo(() => {
    const byDate = (a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || "");
    const inPhase = (phase) => matching.filter((e) => getEventPhase(e, today) === phase);
    const valueOf = {
      date: (e) => `${e.date} ${e.startTime || ""}`,
      title: (e) => e.title,
      points: (e) => Number(e.pointValue) || 0,
      present: (e) => presentCounts[e.id] ?? 0,
    }[sortKey];
    const order = (list, fallback) => (valueOf ? sortBy(list, valueOf, sortDir) : list.sort(fallback));
    return [
      { key: "today", title: "Open now", hint: "Scanning is open until an admin closes the event", list: order(inPhase("today"), byDate) },
      { key: "upcoming", title: "Upcoming", hint: "Time in opens at the start time", list: order(inPhase("upcoming"), byDate) },
      { key: "done", title: "Closed", hint: "Closed by an admin; scanning has ended", list: order(inPhase("done"), (a, b) => byDate(b, a)) },
    ].filter((s) => s.list.length > 0);
  }, [matching, today, sortKey, sortDir, presentCounts]);
  const filtering = query.trim() || program !== "ANY";
  const resetKey = `${query}|${program}|${sortKey}|${sortDir}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Events" subtitle={`${events.length} in total`}>
        {onCreate && (
          <button type="button" onClick={onCreate} className="btn-primary">
            <FiPlus size={14} /> New event
          </button>
        )}
      </PageHeader>

      {events.length === 0 && (
        <div className="surface">
          <EmptyState>{onCreate ? "No events yet. Create one to start taking attendance." : "No events yet."}</EmptyState>
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1 sm:max-w-sm">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events"
              className="input pl-9"
            />
          </div>
          <MiniSelect
            label="Program"
            value={program}
            onChange={setProgram}
            options={[
              { value: "ANY", label: "Any program" },
              { value: "ALL", label: "For all programs" },
              ...programs.map((p) => ({ value: p, label: p })),
            ]}
          />
          <MiniSelect label="Sort events by" value={sortKey} onChange={setSortKey} options={SORTS} />
          {sortKey !== "auto" && <DirectionToggle dir={sortDir} onChange={setSortDir} />}
          {filtering && (
            <span className="text-xs muted">
              Showing {matching.length} of {events.length}
            </span>
          )}
        </div>
      )}

      {events.length > 0 && matching.length === 0 && (
        <div className="surface">
          <EmptyState>No events match.</EmptyState>
        </div>
      )}

      {sections.map((section) => (
        <EventSection
          key={section.key}
          resetKey={resetKey}
          section={section}
          today={today}
          students={students}
          presentCounts={presentCounts}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
