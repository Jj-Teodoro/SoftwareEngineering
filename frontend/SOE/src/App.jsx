import { useState } from "react";
import LoginPage from "./Login/Login";
import DashboardShell from "./Dashboard/DashboardShell";
import { StudentsProvider } from "./context/StudentsContext";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <StudentsProvider>
      {currentUser ? (
        <DashboardShell
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
        />
      ) : (
        <LoginPage onLoginSuccess={(student) => setCurrentUser(student)} />
      )}
    </StudentsProvider>
  );
}
