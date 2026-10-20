import { FiBell, FiSettings } from "react-icons/fi";
import oasis_logo from "../../assets/oasis-logo.png";
import { useNotifications } from "../../context/student/NotificationsContext";
import { useNotificationPref } from "../../context/student/NotificationPrefContext";

const NAV = [
  { id: "Activity", label: "Profile" },
  { id: "Events", label: "Events" },
];

export default function Header({ active, onNavigate }) {
  const { unreadCount } = useNotifications();
  const { showBadge } = useNotificationPref();

  const iconClass = (id) =>
    `relative flex h-10 w-10 items-center justify-center rounded-full transition ${
      active === id ? "bg-[var(--gold)] text-[var(--on-gold)]" : "bg-white/10 text-white hover:bg-white/20"
    }`;

  return (
    <header className="rounded-b-[32px] bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] pb-5 pt-4 shadow-[0_10px_30px_rgba(74,13,16,0.25)]">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-4 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <img src={oasis_logo} alt="OASIS" className="h-9 w-auto" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("Notifications")}
              className={iconClass("Notifications")}
              aria-label="Notifications"
            >
              <FiBell size={19} />
              {showBadge && unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--on-gold)]">
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
              <FiSettings size={19} />
            </button>
          </div>
        </div>

        <nav className="flex rounded-2xl bg-black/25 p-1" aria-label="Main">
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[var(--gold)] text-[var(--on-gold)] shadow"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
