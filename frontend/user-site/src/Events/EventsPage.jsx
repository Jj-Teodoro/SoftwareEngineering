import { FiAward, FiCalendar, FiCheckCircle, FiLock, FiZap } from "react-icons/fi";
import {
  daysUntil,
  formatEventDate,
  getEventPhase,
  todayLocal,
} from "@oasis/shared/utils/events.js";
import Panel from "../components/Panel";
import { useEvents } from "../context/EventsContext";

function WhenChip({ event }) {
  const phase = getEventPhase(event);
  if (phase === "today") {
    return (
      <span className="inline-flex items-center gap-1 border border-[var(--neon-cyan)] bg-[rgba(5,217,232,0.12)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[1px] text-[var(--neon-cyan)] shadow-[0_0_8px_rgba(5,217,232,0.35)]">
        <FiZap size={10} /> Today
      </span>
    );
  }
  if (phase === "upcoming") {
    const days = daysUntil(event.date);
    return (
      <span className="inline-flex items-center gap-1 border border-[var(--surface-border)] bg-[var(--surface-strong)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
        <FiLock size={10} /> {days === 1 ? "Tomorrow" : `In ${days} days`}
      </span>
    );
  }
  return null;
}

export function EventCard({ event, attended }) {
  const isRestricted = event.programFilter && event.programFilter !== "ALL";
  return (
    <div
      style={{ "--notch": "16px" }}
      className="cp-notch overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-2)] transition-colors hover:border-[var(--gold)]"
    >
      {event.image && <img src={event.image} alt="" className="h-32 w-full object-cover" />}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          {attended ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-[1px] text-[var(--neon-cyan)]">
              <FiCheckCircle size={12} /> Attended
            </span>
          ) : (
            <WhenChip event={event} />
          )}
          <span className="flex shrink-0 items-center gap-1 bg-[var(--gold)] px-2 py-0.5 font-mono text-[10px] font-bold text-[#1a0405] [clip-path:polygon(0_0,100%_0,100%_65%,80%_100%,0_100%)]">
            <FiAward size={10} /> {event.pointValue} pts
          </span>
        </div>
        <p className="text-sm font-bold uppercase tracking-[1px] text-[var(--text-primary)]">{event.title}</p>
        <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
          <FiCalendar size={11} /> {formatEventDate(event.date)}
        </p>
        {event.description && (
          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--text-muted)]">
            {event.description}
          </p>
        )}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[2px] text-[var(--gold)] opacity-70">
          {isRestricted ? event.programFilter : "All Programs"}
        </p>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { upcoming, attended } = useEvents();
  const sortedUpcoming = [...upcoming].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Upcoming Events">
        {sortedUpcoming.length === 0 ? (
          <p className="font-mono text-sm text-[var(--text-muted)]">
            No upcoming events for you right now. New ones show up here and in Notifications.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedUpcoming.map((event) => (
              <EventCard key={event.id} event={event} attended={false} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Attended">
        {attended.length === 0 ? (
          <p className="font-mono text-sm text-[var(--text-muted)]">You haven't attended any events yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attended.map((event) => (
              <EventCard key={event.id} event={event} attended />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
