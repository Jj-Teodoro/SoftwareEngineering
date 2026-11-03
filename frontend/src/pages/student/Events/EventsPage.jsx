import { FiAward, FiCalendar, FiCheckCircle, FiClock, FiZap } from "react-icons/fi";
import { daysUntil, formatEventDate, getEventPhase } from "../../../utils/events.js";
import Panel from "../../../components/student/Panel";
import { useEvents } from "../../../context/student/EventsContext";

function WhenChip({ event }) {
  const phase = getEventPhase(event);
  if (phase === "today") {
    return (
      <span className="st-chip bg-[color-mix(in_srgb,var(--ok)_15%,transparent)] text-[var(--ok)]">
        <FiZap size={12} /> Today
      </span>
    );
  }
  if (phase === "upcoming") {
    const days = daysUntil(event.date);
    return (
      <span className="st-chip bg-[var(--card)] text-[var(--text-muted)]">
        <FiClock size={12} /> {days === 1 ? "Tomorrow" : `In ${days} days`}
      </span>
    );
  }
  return null;
}

export function EventCard({ event, attended }) {
  const isRestricted = event.programFilter && event.programFilter !== "ALL";
  return (
    <div className="st-inset overflow-hidden">
      {event.image && <img src={event.image} alt="" className="h-32 w-full object-cover" />}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          {attended ? (
            <span className="st-chip bg-[color-mix(in_srgb,var(--ok)_15%,transparent)] text-[var(--ok)]">
              <FiCheckCircle size={12} /> Attended
            </span>
          ) : (
            <WhenChip event={event} />
          )}
          <span className="st-chip shrink-0 bg-[var(--gold)] text-[var(--on-gold)]">
            <FiAward size={12} /> {event.pointValue} pts
          </span>
        </div>
        <p className="text-sm font-bold">{event.title}</p>
        <p className="st-muted mt-1 flex items-center gap-1.5 text-xs">
          <FiCalendar size={12} /> {formatEventDate(event.date)}
        </p>
        {event.description && (
          <p className="st-muted mt-2 whitespace-pre-line text-xs leading-relaxed">{event.description}</p>
        )}
        <p className="st-label mt-3 opacity-80">{isRestricted ? event.programFilter : "All programs"}</p>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { upcoming, attended } = useEvents();
  const sortedUpcoming = [...upcoming].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-5">
      <Panel title="Upcoming events">
        {sortedUpcoming.length === 0 ? (
          <p className="st-muted text-sm">
            No upcoming events for you right now. New ones show up here and in Notifications.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedUpcoming.map((event) => (
              <EventCard key={event.id} event={event} attended={false} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Attended">
        {attended.length === 0 ? (
          <p className="st-muted text-sm">You haven't attended any events yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attended.map((event) => (
              <EventCard key={event.id} event={event} attended />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
