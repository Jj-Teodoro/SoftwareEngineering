import { FiAward, FiBell, FiCalendar } from "react-icons/fi";
import { formatEventDate } from "@oasis/shared/utils/events.js";
import Panel from "../components/Panel";
import { useEvents } from "../context/EventsContext";
import { useNotifications } from "../context/NotificationsContext";

function formatDate(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const { notifications, isRead, markRead } = useNotifications();
  const { events } = useEvents();

  // Event announcements point at an event; hide ones whose event is gone.
  const visible = notifications.filter(
    (n) => n.type !== "event" || events.some((e) => e.id === n.eventId)
  );

  return (
    <Panel title="Notifications">
      {visible.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <FiBell size={24} className="text-[var(--gold)]" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => {
            const read = isRead(n.id);
            const event = n.type === "event" ? events.find((e) => e.id === n.eventId) : null;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !read && markRead(n.id)}
                className={`block w-full overflow-hidden rounded-xl border text-left transition-all ${
                  read
                    ? "border-[var(--surface-border)] bg-[var(--surface-2)]"
                    : "border-[var(--gold)] bg-[var(--surface-strong)]"
                }`}
              >
                {event?.image && (
                  <img src={event.image} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="flex items-start gap-3 px-4 py-3">
                  {!read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    {event ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gold)]">
                          New event
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[var(--text-primary)]">
                          {event.title}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar size={11} /> {formatEventDate(event.date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiAward size={11} /> {event.pointValue} pts
                          </span>
                        </p>
                        {event.description && (
                          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[var(--text-muted)]">
                            {event.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {n.message}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
