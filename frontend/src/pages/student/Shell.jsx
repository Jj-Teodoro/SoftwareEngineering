import { useState } from "react";
import PageBackground from "../../components/student/PageBackground";
import Header from "../../components/student/Header";
import ActivityPage from "./Activity/ActivityPage";
import EventsPage from "./Events/EventsPage";
import NotificationsPage from "./Notifications/NotificationsPage";
import SettingsPage from "./Settings/SettingsPage";

export default function Shell({ onLogout }) {
  const [activeTab, setActiveTab] = useState("Activity");

  return (
    <PageBackground>
      <Header active={activeTab} onNavigate={setActiveTab} />
      <main className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6">
        {activeTab === "Activity" && <ActivityPage />}
        {activeTab === "Events" && <EventsPage />}
        {activeTab === "Notifications" && <NotificationsPage />}
        {activeTab === "Settings" && <SettingsPage onLogout={onLogout} />}
      </main>
    </PageBackground>
  );
}
