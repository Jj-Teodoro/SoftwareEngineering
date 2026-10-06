import { FiBell, FiSettings } from "react-icons/fi";
import oasis_logo from "../assets/oasislogo.gif";
import { useNotifications } from "../context/NotificationsContext";
import { useNotificationPref } from "../context/NotificationPrefContext";

const NAV = [
  { id: "Activity", label: "Profile" },
  { id: "Events", label: "Upcoming Events" },
];

export default function Header({ active, onNavigate }) {
  const { unreadCount } = useNotifications();
  const { showBadge } = useNotificationPref();

  const iconClass = (id) =>
    `relative flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 ${
      active === id ? "bg-white/15" : ""
    }`;

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[14px] border-2 border-[var(--gold)] bg-[var(--header-bg)] px-5 py-3">
      <img
        src={oasis_logo}
        alt="OASIS"
        className="-my-3 h-auto w-[165px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
      />

      <nav className="order-last flex w-full items-center justify-center gap-4 sm:order-none sm:w-auto">
        {NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`rounded-lg border px-6 py-2.5 text-[11px] font-bold uppercase tracking-[2px] transition-all sm:px-8 ${
                isActive
                  ? "border-white bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                  : "border-transparent bg-[var(--nav-idle-bg)] text-[var(--nav-idle-text)] hover:brightness-95"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onNavigate("Notifications")}
          className={iconClass("Notifications")}
          aria-label="Notifications"
        >
          <FiBell size={26} className="text-[var(--gold)]" />
          {showBadge && unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("Settings")}
          className={iconClass("Settings")}
          aria-label="Settings"
        >
          <FiSettings size={26} className="text-white" />
        </button>
      </div>
    </header>
  );
}
