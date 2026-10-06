import { FiBell } from "react-icons/fi";
import Panel from "../components/Panel";
import { useNotifications } from "../context/NotificationsContext";

function formatDate(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const { notifications, isRead, markRead } = useNotifications();

  return (
    <Panel title="Notifications">
      {notifications.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
            <FiBell size={24} className="text-[var(--gold)]" />
          </div>
          <p className="text-sm text-[var(--text-muted)]">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const read = isRead(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !read && markRead(n.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  read
                    ? "border-[var(--surface-border)] bg-[var(--surface-2)]"
                    : "border-[var(--gold)] bg-[var(--surface-strong)]"
                }`}
              >
                {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{n.message}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
