import usePersistedState from "../../hooks/usePersistedState";
import { programTheme } from "../../components/common/StudentIdCard.jsx";
import { useStudent } from "../../context/student/StudentContext";
import PageBackground from "../../components/student/PageBackground";
import Header from "../../components/student/Header";
import ActivityPage from "./Activity/ActivityPage";
import EventsPage from "./Events/EventsPage";
import NotificationsPage from "./Notifications/NotificationsPage";
import SettingsPage from "./Settings/SettingsPage";

export default function Shell({ onLogout }) {
  // the open tab survives a reload of this browser tab
  const [activeTab, setActiveTab] = usePersistedState("oasis-user-tab", "Activity");
  const { student } = useStudent();
  const theme = programTheme(student?.course);
  const colours = {
    "--prog-accent": theme.accent,
    "--prog-deep": theme.deep,
    "--prog-ink": theme.ink,
    "--prog-bg1": theme.bg[0],
    "--prog-bg3": theme.bg[2],
  };

  return (
    <PageBackground>
      <div className="st-program" style={colours}>
      <Header active={activeTab} onNavigate={setActiveTab} />
      <main className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6">
        {activeTab === "Activity" && <ActivityPage />}
        {activeTab === "Events" && <EventsPage />}
        {activeTab === "Notifications" && <NotificationsPage />}
        {activeTab === "Settings" && <SettingsPage onLogout={onLogout} onNavigate={setActiveTab} />}
      </main>
      </div>
    </PageBackground>
  );
}
