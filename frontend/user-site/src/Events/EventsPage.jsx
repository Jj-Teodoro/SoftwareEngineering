import { FiAward, FiCheckCircle } from "react-icons/fi";
import Panel from "../components/Panel";
import { useEvents } from "../context/EventsContext";

function EventCard({ event, attended }) {
  const isRestricted = event.programFilter && event.programFilter !== "ALL";
  return (
    <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-[var(--text-primary)]">{event.title}</p>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-bold text-[#2b0a0c]">
          <FiAward size={10} /> {event.pointValue} pts
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{event.date}</p>
      {event.description && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{event.description}</p>
      )}
      <p className="mt-1 text-xs text-[var(--text-faint)]">
        {isRestricted ? event.programFilter : "All Programs"}
      </p>
      {attended && (
        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-green-500">
          <FiCheckCircle size={12} /> Attended
        </p>
      )}
    </div>
  );
}

export default function EventsPage() {
  const { upcoming, attended } = useEvents();

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Upcoming Events">
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No upcoming events for you right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
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
