import { useState } from "react";
import LoginPage from "./Login/Login";
import DashboardShell from "./Dashboard/DashboardShell";
import StudentKioskView from "./Kiosk/StudentKioskView";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { StudentsProvider } from "./context/StudentsContext";
import { EventsProvider } from "./context/EventsContext";
import { RequirementsProvider } from "./context/RequirementsContext";
import { PointsProvider } from "./context/PointsContext";
import { PresenceProvider } from "./context/PresenceContext";

function AppContent() {
  const { signOut } = useAdmin();
  const [currentUser, setCurrentUser] = useState(null);
  const [kioskEventId, setKioskEventId] = useState(null);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  if (kioskEventId) {
    return (
      <StudentKioskView
        eventId={kioskEventId}
        currentAdmin={currentUser}
        onExit={() => setKioskEventId(null)}
      />
    );
  }

  if (currentUser) {
    return (
      <DashboardShell
        currentUser={currentUser}
        onLogout={handleLogout}
        onStartKiosk={setKioskEventId}
      />
    );
  }

  return <LoginPage onLoginSuccess={(admin) => setCurrentUser(admin)} />;
}

export default function App() {
  return (
    <AdminProvider>
      <StudentsProvider>
        <EventsProvider>
          <RequirementsProvider>
            <PointsProvider>
              <PresenceProvider>
                <AppContent />
              </PresenceProvider>
            </PointsProvider>
          </RequirementsProvider>
        </EventsProvider>
      </StudentsProvider>
    </AdminProvider>
  );
}
