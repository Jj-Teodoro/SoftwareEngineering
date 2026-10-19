import { FiBell, FiSettings } from "react-icons/fi";
import oasis_logo from "../assets/oasislogo.gif";
import { useNotifications } from "../context/NotificationsContext";
import { useNotificationPref } from "../context/NotificationPrefContext";
import CyberFrame from "./CyberFrame";

const NAV = [
  { id: "Activity", label: "Profile" },
  { id: "Events", label: "Upcoming Events" },
];

export default function Header({ active, onNavigate }) {
  const { unreadCount } = useNotifications();
  const { showBadge } = useNotificationPref();

  const iconClass = (id) =>
    `relative flex h-10 w-10 items-center justify-center transition-all hover:scale-110 ${
      active === id
        ? "text-[var(--neon-cyan)] drop-shadow-[0_0_6px_var(--neon-cyan)]"
        : "text-[var(--gold)]"
    }`;

  return (
    <CyberFrame cut={16} slashes={false} innerClassName="px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <img
          src={oasis_logo}
          alt="OASIS"
          className="-my-3 h-auto w-[165px] object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
        />

        <nav className="order-last flex w-full items-center justify-center gap-3 sm:order-none sm:w-auto">
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                style={{ "--notch-color": isActive ? "var(--neon-cyan)" : "var(--gold)" }}
                className={`cp-notch border px-5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[2px] transition-all sm:px-7 ${
                  isActive
                    ? "border-[var(--neon-cyan)] bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-[0_0_14px_rgba(5,217,232,0.35)]"
                    : "border-[var(--surface-border)] bg-[var(--nav-idle-bg)] text-[var(--nav-idle-text)] hover:border-[var(--gold)] hover:bg-[var(--surface-strong)]"
                }`}
              >
                <span className="mr-1 opacity-60">{isActive ? ">" : "/"}</span>
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
            <FiBell size={25} />
            {showBadge && unreadCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center bg-[var(--neon-pink)] px-1 font-mono text-[9px] font-bold text-white shadow-[0_0_8px_var(--neon-pink)] [clip-path:polygon(0_0,100%_0,100%_70%,70%_100%,0_100%)]">
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
            <FiSettings size={25} />
          </button>
        </div>
      </div>
    </CyberFrame>
  );
}
