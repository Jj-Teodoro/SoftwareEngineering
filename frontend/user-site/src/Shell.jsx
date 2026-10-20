import { useState } from "react";
import PageBackground from "./components/PageBackground";
import Header from "./components/Header";
import ActivityPage from "./Activity/ActivityPage";
import EventsPage from "./Events/EventsPage";
import NotificationsPage from "./Notifications/NotificationsPage";
import SettingsPage from "./Settings/SettingsPage";

export default function Shell({ onLogout }) {
  const [activeTab, setActiveTab] = useState("Activity");

  return (
    <PageBackground>
      <div className="mx-auto flex min-h-screen w-full max-w-[1040px] flex-col gap-6 px-4 py-6 sm:px-6">
        <Header active={activeTab} onNavigate={setActiveTab} />
        <main>
          {activeTab === "Activity" && <ActivityPage />}
          {activeTab === "Events" && <EventsPage />}
          {activeTab === "Notifications" && <NotificationsPage />}
          {activeTab === "Settings" && <SettingsPage onLogout={onLogout} onNavigate={setActiveTab} />}
        </main>
      </div>
    </PageBackground>
  );
}
