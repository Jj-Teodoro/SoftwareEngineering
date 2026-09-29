import { useState } from "react";
import LoginPage from "./Login/Login";
import DashboardShell from "./Dashboard/DashboardShell";
import StudentKioskView from "./Kiosk/StudentKioskView";
import { AdminProvider, useAdmin } from "./context/AdminContext";
import { StudentsProvider } from "./context/StudentsContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import { RequirementsProvider } from "./context/RequirementsContext";

function AppContent() {
  const { signOut } = useAdmin();
  const [currentUser, setCurrentUser] = useState(null);
  const [kioskSheetId, setKioskSheetId] = useState(null);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  if (kioskSheetId) {
    return (
      <StudentKioskView
        sheetId={kioskSheetId}
        currentAdmin={currentUser}
        onExit={() => setKioskSheetId(null)}
      />
    );
  }

  if (currentUser) {
    return (
      <DashboardShell
        currentUser={currentUser}
        onLogout={handleLogout}
        onStartKiosk={setKioskSheetId}
      />
    );
  }

  return <LoginPage onLoginSuccess={(admin) => setCurrentUser(admin)} />;
}

export default function App() {
  return (
    <AdminProvider>
      <StudentsProvider>
        <AttendanceProvider>
          <RequirementsProvider>
            <AppContent />
          </RequirementsProvider>
        </AttendanceProvider>
      </StudentsProvider>
    </AdminProvider>
  );
}
