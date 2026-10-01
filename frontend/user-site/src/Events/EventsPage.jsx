import { FiAward, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { useEvents } from "../context/EventsContext";

function EventCard({ event, attended }) {
  const isRestricted = event.programFilter && event.programFilter !== "ALL";
  return (
    <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-[var(--text-primary)]">{event.title}</p>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#97191d]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--text-primary)]">
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
        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-green-400">
          <FiCheckCircle size={12} /> Attended
        </p>
      )}
    </div>
  );
}

export default function EventsPage() {
  const { upcoming, attended } = useEvents();

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
        Events
      </h2>

      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
          <FiCalendar size={16} /> Upcoming
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No upcoming events for you right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} attended={false} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
          <FiCheckCircle size={16} /> Attended
        </h3>
        {attended.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">You haven't attended any events yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attended.map((event) => (
              <EventCard key={event.id} event={event} attended />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
