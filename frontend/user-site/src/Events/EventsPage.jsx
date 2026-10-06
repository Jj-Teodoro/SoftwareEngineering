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
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[1px] text-green-400">
        <FiZap size={10} /> Today
      </span>
    );
  }
  if (phase === "upcoming") {
    const days = daysUntil(event.date);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-strong)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
        <FiLock size={10} /> {days === 1 ? "Tomorrow" : `In ${days} days`}
      </span>
    );
  }
  return null;
}

export function EventCard({ event, attended }) {
  const isRestricted = event.programFilter && event.programFilter !== "ALL";
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)]">
      {event.image && <img src={event.image} alt="" className="h-32 w-full object-cover" />}
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          {attended ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[1px] text-green-500">
              <FiCheckCircle size={12} /> Attended
            </span>
          ) : (
            <WhenChip event={event} />
          )}
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-bold text-[#2b0a0c]">
            <FiAward size={10} /> {event.pointValue} pts
          </span>
        </div>
        <p className="text-sm font-bold text-[var(--text-primary)]">{event.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <FiCalendar size={11} /> {formatEventDate(event.date)}
        </p>
        {event.description && (
          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--text-muted)]">
            {event.description}
          </p>
        )}
        <p className="mt-2 text-[11px] uppercase tracking-[1px] text-[var(--text-faint)]">
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
          <p className="text-sm text-[var(--text-muted)]">
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
          <p className="text-sm text-[var(--text-muted)]">You haven't attended any events yet.</p>
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
