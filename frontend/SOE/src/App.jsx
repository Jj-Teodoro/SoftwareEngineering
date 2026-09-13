import { useState } from "react";
import LoginPage from "./Login/Login";
import DashboardShell from "./Dashboard/DashboardShell";
import { AdminProvider } from "./context/AdminContext";
import { StudentsProvider } from "./context/StudentsContext";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <AdminProvider>
      <StudentsProvider>
        {currentUser ? (
          <DashboardShell
            currentUser={currentUser}
            onLogout={() => setCurrentUser(null)}
          />
        ) : (
          <LoginPage onLoginSuccess={(admin) => setCurrentUser(admin)} />
        )}
      </StudentsProvider>
    </AdminProvider>
  );
}
