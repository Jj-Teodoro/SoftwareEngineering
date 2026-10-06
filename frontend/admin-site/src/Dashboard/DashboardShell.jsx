import { useState } from "react";
import PageBackground from "../components/PageBackground";
import Sidebar from "../components/Sidebar";
import UserPage from "../User/UserPage";
import EventsPage from "../Events/EventsPage";
import ImportPage from "../Import/ImportPage";
import DashboardHome from "./DashboardHome";
import ScanPage from "../Scan/ScanPage";
import RequirementsPage from "../Requirements/RequirementsPage";

export default function DashboardShell({ currentUser, onLogout, onStartKiosk }) {
  const [activeTab, setActiveTab] = useState("Dashboard");

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
          {activeTab === "User" && <UserPage />}
          {activeTab === "Dashboard" && <DashboardHome onNavigate={setActiveTab} />}
          {activeTab === "Requirements" && <RequirementsPage />}
          {activeTab === "Event" && <EventsPage onStartKiosk={onStartKiosk} />}
          {activeTab === "Scan" && <ScanPage onStartKiosk={onStartKiosk} />}
          {activeTab === "Import" && <ImportPage />}
        </main>
      </div>
    </PageBackground>
  );
}
