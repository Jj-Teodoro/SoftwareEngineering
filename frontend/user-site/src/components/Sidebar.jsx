import oasis_logo from "../assets/oasislogo.gif";
import { useNotifications } from "../context/NotificationsContext";
import { useNotificationPref } from "../context/NotificationPrefContext";

const NAV_ITEMS = ["Activity", "Events", "Notifications", "Settings"];

export default function Sidebar({ active, onNavigate, currentUser, onLogout }) {
  const { unreadCount } = useNotifications();
  const { showBadge } = useNotificationPref();

  return (
    <aside className="flex w-full max-w-[280px] flex-col items-center rounded-[30px] border border-[var(--surface-border)] bg-[var(--surface)] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <img
        src={oasis_logo}
        alt="OASIS Logo"
        className="max-w-[180px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
      />

      {currentUser && (
        <div className="mt-6 w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3 text-center">
          <p className="truncate text-xs font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
            {currentUser.name}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">{currentUser.studentId}</p>
        </div>
      )}

      <nav className="mt-10 flex w-full flex-col gap-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item === active;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onNavigate?.(item)}
              className={`relative flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-[2px] transition-all ${
                isActive
                  ? "border-[var(--surface-border)] bg-[#97191d] text-white shadow-[0_0_20px_rgba(184,31,37,0.5)]"
                  : "border-[var(--surface-border)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-strong)]"
              }`}
            >
              {item}
              {item === "Notifications" && showBadge && unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#97191d]">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          className="mt-auto w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-strong)]"
        >
          Log Out
        </button>
      )}
    </aside>
  );
}
