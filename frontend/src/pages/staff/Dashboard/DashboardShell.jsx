import { useState } from "react";
import { FiCalendar, FiCamera, FiCheckSquare, FiGrid, FiSettings, FiUploadCloud, FiUsers } from "react-icons/fi";
import AppShell from "../../../components/common/AppShell.jsx";
import { useReportLocation } from "../../../components/common/StaffPresenceTracker.jsx";
import oasis_logo from "../../../assets/oasislogo.gif";
import UserPage from "../Students/UserPage";
import EventsPage from "../Events/EventsPage";
import ImportPage from "../Import/ImportPage";
import DashboardHome from "./DashboardHome";
import ScanPage from "../Scan/ScanPage";
import RequirementsPage from "../Requirements/RequirementsPage";
import AdminSettingsPage from "../Settings/AdminSettingsPage";

const NAV = [
  { id: "Dashboard", label: "Dashboard", icon: FiGrid },
  { id: "User", label: "Students", icon: FiUsers },
  { id: "Requirements", label: "Requirements", icon: FiCheckSquare },
  { id: "Event", label: "Events", icon: FiCalendar },
  { id: "Scan", label: "Scan", icon: FiCamera },
  { id: "Import", label: "Import", icon: FiUploadCloud },
  { id: "Settings", label: "Settings", icon: FiSettings },
];

export default function DashboardShell({ currentUser, onLogout, onStartKiosk }) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  useReportLocation(NAV.find((n) => n.id === activeTab)?.label || activeTab);

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
      {activeTab === "Settings" && <AdminSettingsPage currentUser={currentUser} />}
    </AppShell>
  );
}
