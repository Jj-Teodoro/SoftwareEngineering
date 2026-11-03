import { FiAward, FiBell, FiCalendar } from "react-icons/fi";
import { formatEventDate } from "../../../utils/events.js";
import Panel from "../../../components/student/Panel";
import { useEvents } from "../../../context/student/EventsContext";
import { useNotifications } from "../../../context/student/NotificationsContext";

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
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--card-2)] text-[var(--accent-text)]">
            <FiBell size={24} />
          </span>
          <p className="st-muted text-sm">No notifications yet.</p>
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
                className={`st-inset block w-full overflow-hidden border text-left transition ${
                  read ? "border-transparent" : "border-[color-mix(in_srgb,var(--gold)_60%,transparent)]"
                }`}
              >
                {event?.image && <img src={event.image} alt="" className="h-40 w-full object-cover" />}
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      read ? "bg-transparent" : "bg-[var(--gold)]"
                    }`}
                    aria-label={read ? undefined : "Unread"}
                  />
                  <div className="min-w-0 flex-1">
                    {event ? (
                      <>
                        <p className="st-label">
                          {n.kind === "reminder"
                            ? "Reminder"
                            : n.kind === "update"
                            ? "Event updated"
                            : "New event"}
                        </p>
                        <p className="mt-0.5 text-sm font-bold">{event.title}</p>
                        <p className="st-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar size={12} /> {formatEventDate(event.date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiAward size={12} /> {event.pointValue} pts
                          </span>
                        </p>
                        {event.description && (
                          <p className="st-muted mt-2 whitespace-pre-line text-xs leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-semibold">{n.message}</p>
                    )}
                    <p className="mt-2 text-[11px] text-[var(--text-faint)]">{formatDate(n.createdAt)}</p>
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
