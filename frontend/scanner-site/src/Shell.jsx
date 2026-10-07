import usePersistedState from "@oasis/shared/hooks/usePersistedState.js";
import { FiCalendar, FiCamera, FiSettings } from "react-icons/fi";
import AppShell from "@oasis/shared/components/AppShell.jsx";
import { useReportLocation } from "@oasis/shared/components/StaffPresenceTracker.jsx";
import oasis_logo from "./assets/oasislogo.gif";
import EventsPage from "./Events/EventsPage";
import ScanPage from "./Scan/ScanPage";
import SettingsPage from "./Settings/SettingsPage";

const NAV = [
  { id: "Event", label: "Events", icon: FiCalendar },
  { id: "Scan", label: "Scan", icon: FiCamera },
  { id: "Settings", label: "Settings", icon: FiSettings },
];

export default function Shell({ currentUser, onLogout, onStartKiosk }) {
  const [activeTab, setActiveTab] = usePersistedState("oasis-scanner-tab", "Scan");
  useReportLocation(NAV.find((n) => n.id === activeTab)?.label || activeTab);

  return (
    <AppShell
      nav={NAV}
      active={activeTab}
      onNavigate={setActiveTab}
      user={currentUser}
      role="Scanner"
      logoSrc={oasis_logo}
      onLogout={onLogout}
    >
      {activeTab === "Event" && <EventsPage />}
      {activeTab === "Scan" && <ScanPage onStartKiosk={onStartKiosk} />}
      {activeTab === "Settings" && <SettingsPage currentUser={currentUser} onLogout={onLogout} />}
    </AppShell>
  );
}
