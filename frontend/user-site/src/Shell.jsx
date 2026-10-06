import { useState } from "react";
import PageBackground from "./components/PageBackground";
import Sidebar from "./components/Sidebar";
import ActivityPage from "./Activity/ActivityPage";
import EventsPage from "./Events/EventsPage";
import NotificationsPage from "./Notifications/NotificationsPage";
import SettingsPage from "./Settings/SettingsPage";

export default function Shell({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("Activity");

  return (
    <PageBackground>
      <div className="flex min-h-screen flex-col gap-8 px-6 py-10 lg:flex-row lg:px-12">
        <Sidebar
          active={activeTab}
          onNavigate={setActiveTab}
          currentUser={currentUser}
          onLogout={onLogout}
        />

        <main className="flex-1">
          {activeTab === "Activity" && <ActivityPage />}
          {activeTab === "Events" && <EventsPage />}
          {activeTab === "Notifications" && <NotificationsPage />}
          {activeTab === "Settings" && <SettingsPage />}
        </main>
      </div>
    </PageBackground>
  );
}
