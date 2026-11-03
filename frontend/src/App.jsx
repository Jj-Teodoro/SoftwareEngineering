import { useEffect, useState } from "react";
import { currentPortal } from "./api/portal";
import { useSignedIn } from "./api/hooks";
import { hasSession } from "./api/client";
import usePersistedState from "./hooks/usePersistedState";
import LoadingScreen from "./components/common/LoadingScreen.jsx";
import { ConfirmProvider } from "./components/common/ConfirmDialog.jsx";
import StaffPresenceTracker from "./components/common/StaffPresenceTracker.jsx";

// staff (admin + scanner)
import StaffLogin from "./pages/staff/Login/Login";
import StaffForcePasswordChange from "./pages/staff/Login/ForcePasswordChange";
import DashboardShell from "./pages/staff/Dashboard/DashboardShell";
import ScannerShell from "./pages/staff/ScannerShell";
import StudentKioskView from "./pages/staff/Kiosk/StudentKioskView";
import { StaffAuthProvider, useStaffAuth } from "./context/staff/AuthContext";
import { StaffProvider } from "./context/staff/StaffContext";
import { StudentsProvider } from "./context/staff/StudentsContext";
import { EventsProvider } from "./context/staff/EventsContext";
import { RequirementsProvider } from "./context/staff/RequirementsContext";
import { PointsProvider } from "./context/staff/PointsContext";
import { PresenceProvider } from "./context/staff/PresenceContext";

// students
import PageBackground from "./components/student/PageBackground";
import PresenceTracker, { markOffline } from "./components/student/PresenceTracker";
import AuthPage from "./pages/student/Login/AuthPage";
import Landing from "./pages/student/Landing/Landing";
import ForcePasswordChange from "./pages/student/Login/ForcePasswordChange";
import StudentShell from "./pages/student/Shell";
import { ThemeProvider } from "./context/student/ThemeContext";
import { NotificationPrefProvider } from "./context/student/NotificationPrefContext";
import { AuthProvider, useAuth } from "./context/student/AuthContext";
import { StudentProvider, useStudent } from "./context/student/StudentContext";
import { RequirementsProvider as StudentRequirementsProvider } from "./context/student/RequirementsContext";
import { EventsProvider as StudentEventsProvider } from "./context/student/EventsContext";
import { PointsProvider as StudentPointsProvider } from "./context/student/PointsContext";
import { NotificationsProvider } from "./context/student/NotificationsContext";

/* ------------------------------------------------------------------ staff */

// Login -> shell -> optional kiosk. Admins and scanners share this flow; only the shell differs.
function StaffPortal({ Shell }) {
  const { signOut, restoreSession } = useStaffAuth();
  const signedIn = useSignedIn();
  const [currentUser, setCurrentUser] = useState(null);
  // a running kiosk survives a reload of this browser tab
  const [kioskEventId, setKioskEventId] = usePersistedState(`oasis-${currentPortal()}-kiosk`, null);
  // while a saved sign-in is being restored, show a loading screen instead of flashing the login
  const [restoring, setRestoring] = useState(hasSession);

  useEffect(() => {
    restoreSession()
      .then((staff) => staff && setCurrentUser(staff))
      .finally(() => setRestoring(false));
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

  if (currentUser) {
    return (
      <>
        <StaffPresenceTracker user={currentUser} app={currentPortal()} />
        {currentUser.mustChangePassword ? (
          <StaffForcePasswordChange
            staff={currentUser}
            onDone={() => setCurrentUser({ ...currentUser, mustChangePassword: false })}
            onLogout={handleLogout}
          />
        ) : kioskEventId ? (
          <StudentKioskView
            eventId={kioskEventId}
            currentStaff={currentUser}
            onExit={() => setKioskEventId(null)}
          />
        ) : (
          <Shell currentUser={currentUser} onUserChange={setCurrentUser} onLogout={handleLogout} onStartKiosk={setKioskEventId} />
        )}
      </>
    );
  }

  if (restoring) return <LoadingScreen />;

  return <StaffLogin onLoginSuccess={setCurrentUser} />;
}

function AdminPortal() {
  return (
    <ConfirmProvider>
      <StaffAuthProvider>
        <StaffProvider>
          <StudentsProvider>
            <EventsProvider>
              <RequirementsProvider>
                <PointsProvider>
                  <PresenceProvider>
                    <StaffPortal Shell={DashboardShell} />
                  </PresenceProvider>
                </PointsProvider>
              </RequirementsProvider>
            </EventsProvider>
          </StudentsProvider>
        </StaffProvider>
      </StaffAuthProvider>
    </ConfirmProvider>
  );
}

function ScannerPortal() {
  return (
    <ConfirmProvider>
      <StaffAuthProvider>
        <StudentsProvider>
          <EventsProvider>
            <StaffPortal Shell={ScannerShell} />
          </EventsProvider>
        </StudentsProvider>
      </StaffAuthProvider>
    </ConfirmProvider>
  );
}

/* ----------------------------------------------------------------- student */

function StudentContent() {
  const { signOut } = useAuth();
  const { student, loading } = useStudent();
  const [showLogin, setShowLogin] = useState(() => window.location.hash === "#login");

  useEffect(() => {
    const sync = () => setShowLogin(window.location.hash === "#login");
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  if (loading) {
    return (
      <PageBackground>
        <div className="flex min-h-dvh items-center justify-center text-sm font-medium text-[var(--text-muted)]">
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (!student) {
    // the front page first; "Log in" adds #login to the address, and Back returns to it
    return showLogin ? <AuthPage /> : <Landing />;
  }

  const handleLogout = async () => {
    await markOffline();
    await signOut();
    window.history.replaceState(null, "", window.location.pathname);
    setShowLogin(false);
  };

  return (
    <>
      <PresenceTracker />
      {student.mustChangePassword ? (
        <ForcePasswordChange onLogout={handleLogout} />
      ) : (
        <StudentShell onLogout={handleLogout} />
      )}
    </>
  );
}

function StudentPortal() {
  return (
    <ThemeProvider>
      <NotificationPrefProvider>
        <AuthProvider>
          <StudentProvider>
            <StudentRequirementsProvider>
              <StudentEventsProvider>
                <StudentPointsProvider>
                  <NotificationsProvider>
                    <StudentContent />
                  </NotificationsProvider>
                </StudentPointsProvider>
              </StudentEventsProvider>
            </StudentRequirementsProvider>
          </StudentProvider>
        </AuthProvider>
      </NotificationPrefProvider>
    </ThemeProvider>
  );
}

/* ------------------------------------------------------------------- app */

// One app, three portals picked by the first part of the URL:
//   /admin    staff console
//   /scanner  event check-in for scanner staff
//   /         student site
const PORTALS = {
  admin: { Portal: AdminPortal, title: "OASIS Admin" },
  scanner: { Portal: ScannerPortal, title: "OASIS Scanner" },
  user: { Portal: StudentPortal, title: "OASIS" },
};

export default function App() {
  const { Portal, title } = PORTALS[currentPortal()];

  useEffect(() => {
    document.title = title;
  }, [title]);

  return <Portal />;
}
