import { FiBell } from "react-icons/fi";
import { useNotifications } from "../context/NotificationsContext";

function formatDate(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const { notifications, isRead, markRead } = useNotifications();

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
        Notifications
      </h2>

      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        {notifications.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <FiBell size={24} className="text-[var(--text-faint)]" />
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
                      : "border-[#97191d] bg-[#97191d]/15"
                  }`}
                >
                  {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#97191d]" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{n.message}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
