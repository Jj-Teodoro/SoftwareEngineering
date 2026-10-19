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
          <div className="flex h-14 w-14 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-2)] [clip-path:polygon(25%_0,75%_0,100%_25%,100%_75%,75%_100%,25%_100%,0_75%,0_25%)]">
            <FiBell size={24} className="text-[var(--gold)]" />
          </div>
          <p className="font-mono text-sm text-[var(--text-muted)]">
            &gt; NO NOTIFICATIONS YET<span className="cursor-blink">_</span>
          </p>
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
                style={{
                  "--notch": "16px",
                  "--notch-color": read ? "var(--surface-border)" : "var(--neon-cyan)",
                }}
                className={`cp-notch block w-full overflow-hidden border text-left transition-all ${
                  read
                    ? "border-[var(--surface-border)] bg-[var(--surface-2)]"
                    : "border-[var(--neon-cyan)] bg-[var(--surface-strong)] shadow-[0_0_14px_rgba(5,217,232,0.18)]"
                }`}
              >
                {event?.image && (
                  <img src={event.image} alt="" className="h-40 w-full object-cover" />
                )}
                <div className="flex items-start gap-3 px-4 py-3">
                  {!read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    {event ? (
                      <>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[3px] text-[var(--neon-pink)]">
                          {n.kind === "reminder"
                            ? "Reminder"
                            : n.kind === "update"
                            ? "Event updated"
                            : "New event"}
                        </p>
                        <p className="mt-0.5 text-sm font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
                          {event.title}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--text-muted)]">
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
                    <p className="mt-2 font-mono text-[11px] text-[var(--text-faint)]">
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
