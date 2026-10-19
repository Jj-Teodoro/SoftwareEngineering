import { useState } from "react";
import { FiCalendar, FiCamera, FiCheckSquare, FiGrid, FiUploadCloud, FiUsers } from "react-icons/fi";
import AppShell from "@oasis/shared/components/AppShell.jsx";
import oasis_logo from "../assets/oasislogo.gif";
import UserPage from "../User/UserPage";
import EventsPage from "../Events/EventsPage";
import ImportPage from "../Import/ImportPage";
import DashboardHome from "./DashboardHome";
import ScanPage from "../Scan/ScanPage";
import RequirementsPage from "../Requirements/RequirementsPage";

const NAV = [
  { id: "Dashboard", label: "Dashboard", icon: FiGrid },
  { id: "User", label: "Students", icon: FiUsers },
  { id: "Requirements", label: "Requirements", icon: FiCheckSquare },
  { id: "Event", label: "Events", icon: FiCalendar },
  { id: "Scan", label: "Scan", icon: FiCamera },
  { id: "Import", label: "Import", icon: FiUploadCloud },
];

export default function DashboardShell({ currentUser, onLogout, onStartKiosk }) {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <AppShell
      nav={NAV}
      active={activeTab}
      onNavigate={setActiveTab}
      user={currentUser}
      role="Admin console"
      logoSrc={oasis_logo}
      onLogout={onLogout}
    >
      {activeTab === "User" && <UserPage />}
      {activeTab === "Dashboard" && <DashboardHome onNavigate={setActiveTab} />}
      {activeTab === "Requirements" && <RequirementsPage />}
      {activeTab === "Event" && <EventsPage onStartKiosk={onStartKiosk} />}
      {activeTab === "Scan" && <ScanPage onStartKiosk={onStartKiosk} />}
      {activeTab === "Import" && <ImportPage />}
    </AppShell>
  );
}
