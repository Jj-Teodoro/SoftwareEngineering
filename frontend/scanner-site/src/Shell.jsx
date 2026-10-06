import { useState } from "react";
import PageBackground from "@oasis/shared/components/PageBackground.jsx";
import Sidebar from "./components/Sidebar";
import EventsPage from "./Events/EventsPage";
import ScanPage from "./Scan/ScanPage";
import SettingsPage from "./Settings/SettingsPage";

export default function Shell({ currentUser, onLogout, onStartKiosk }) {
  const [activeTab, setActiveTab] = useState("Scan");

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
          {activeTab === "Event" && <EventsPage />}
          {activeTab === "Scan" && <ScanPage onStartKiosk={onStartKiosk} />}
          {activeTab === "Settings" && <SettingsPage currentUser={currentUser} />}
        </main>
      </div>
    </PageBackground>
  );
}
