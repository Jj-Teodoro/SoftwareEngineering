import { useState } from "react";
import LoginPage from "./Login/Login";
import DashboardShell from "./Dashboard/DashboardShell";
import StudentKioskView from "./Kiosk/StudentKioskView";
import { AdminProvider } from "./context/AdminContext";
import { StudentsProvider } from "./context/StudentsContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import { RequirementsProvider } from "./context/RequirementsContext";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [kioskSheetId, setKioskSheetId] = useState(null);

  return (
    <AdminProvider>
      <StudentsProvider>
        <AttendanceProvider>
          <RequirementsProvider>
            {kioskSheetId ? (
              <StudentKioskView
                sheetId={kioskSheetId}
                currentAdmin={currentUser}
                onExit={() => setKioskSheetId(null)}
              />
            ) : currentUser ? (
              <DashboardShell
                currentUser={currentUser}
                onLogout={() => setCurrentUser(null)}
                onStartKiosk={setKioskSheetId}
              />
            ) : (
              <LoginPage onLoginSuccess={(admin) => setCurrentUser(admin)} />
            )}
          </RequirementsProvider>
        </AttendanceProvider>
      </StudentsProvider>
    </AdminProvider>
  );
}
