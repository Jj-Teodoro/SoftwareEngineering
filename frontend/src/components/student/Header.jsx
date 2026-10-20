import { FiBell, FiSettings } from "react-icons/fi";
import oasis_logo from "../../assets/oasis-logo.png";
import { useNotifications } from "../../context/student/NotificationsContext";
import { useNotificationPref } from "../../context/student/NotificationPrefContext";

const NAV = [
  { id: "Activity", label: "Profile", path: "profile" },
  { id: "Events", label: "Events", path: "events" },
];

export default function Header({ active, onNavigate }) {
  const { unreadCount } = useNotifications();
  const { showBadge } = useNotificationPref();

  const iconClass = (id) =>
    `relative flex h-10 w-10 items-center justify-center rounded-lg border transition ${
      active === id
        ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--on-gold)]"
        : "border-white/15 bg-black/25 text-white hover:border-[var(--gold)]"
    }`;

  return (
    <header
      className="relative border-b-2 bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)]"
      style={{ borderColor: "var(--gold)" }}
    >
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-3 px-4 pb-4 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <img src={oasis_logo} alt="OASIS" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("Notifications")}
              className={iconClass("Notifications")}
              aria-label="Notifications"
            >
              <FiBell size={18} />
              {showBadge && unreadCount > 0 && (
                <span className="st-mono absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--on-gold)]">
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
              <FiSettings size={18} />
            </button>
          </div>
        </div>

        <nav className="flex gap-1 rounded-lg border border-white/15 bg-black/30 p-1" aria-label="Main">
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`st-mono flex-1 rounded-md py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                  isActive ? "bg-[var(--gold)] text-[var(--on-gold)]" : "text-white/75 hover:text-white"
                }`}
              >
                <span className={isActive ? "opacity-60" : "text-[var(--gold)]"}>&gt;</span> {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
