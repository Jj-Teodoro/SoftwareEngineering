import { useEffect, useState } from "react";
import { useSignedIn } from "@oasis/shared/api/hooks.js";
import LoginPage from "./Login/Login";
import Shell from "./Shell";
import StudentKioskView from "./Kiosk/StudentKioskView";
import { ConfirmProvider } from "@oasis/shared/components/ConfirmDialog.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StudentsProvider } from "./context/StudentsContext";
import { EventsProvider } from "./context/EventsContext";

function AppContent() {
  const { signOut, restoreSession } = useAuth();
  const signedIn = useSignedIn();
  const [currentUser, setCurrentUser] = useState(null);
  const [kioskEventId, setKioskEventId] = useState(null);

  useEffect(() => {
    restoreSession().then((staff) => staff && setCurrentUser(staff));
  }, []);

  // the session expired (or was signed out in another tab)
  useEffect(() => {
    if (!signedIn) {
      setCurrentUser(null);
      setKioskEventId(null);
    }
  }, [signedIn]);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
  };

  if (kioskEventId) {
    return (
      <StudentKioskView
        eventId={kioskEventId}
        currentStaff={currentUser}
        onExit={() => setKioskEventId(null)}
      />
    );
  }

  if (currentUser) {
    return (
      <Shell
        currentUser={currentUser}
        onLogout={handleLogout}
        onStartKiosk={setKioskEventId}
      />
    );
  }

  return <LoginPage onLoginSuccess={(staff) => setCurrentUser(staff)} />;
}

export default function App() {
  return (
    <ConfirmProvider>
    <AuthProvider>
      <StudentsProvider>
        <EventsProvider>
          <AppContent />
        </EventsProvider>
      </StudentsProvider>
    </AuthProvider>
    </ConfirmProvider>
  );
}
