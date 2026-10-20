import PageBackground from "./components/PageBackground";
import AuthPage from "./Login/AuthPage";
import Shell from "./Shell";
import ForcePasswordChange from "./Login/ForcePasswordChange";
import PresenceTracker, { markOffline } from "./components/PresenceTracker";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationPrefProvider } from "./context/NotificationPrefContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { StudentProvider, useStudent } from "./context/StudentContext";
import { RequirementsProvider } from "./context/RequirementsContext";
import { EventsProvider } from "./context/EventsContext";
import { PointsProvider } from "./context/PointsContext";
import { NotificationsProvider } from "./context/NotificationsContext";

function AppContent() {
  const { signOut } = useAuth();
  const { student, loading } = useStudent();

  if (loading) {
    return (
      <PageBackground>
        <div className="flex min-h-screen items-center justify-center font-mono text-sm uppercase tracking-[4px] text-[var(--gold)]">
          &gt; Loading<span className="cursor-blink">_</span>
        </div>
      </PageBackground>
    );
  }

  if (!student) {
    return <AuthPage />;
  }

  const handleLogout = async () => {
    await markOffline(student.studentId);
    await signOut();
  };

  return (
    <>
      <PresenceTracker />
      {student.mustChangePassword ? (
        <ForcePasswordChange onLogout={handleLogout} />
      ) : (
        <Shell onLogout={handleLogout} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationPrefProvider>
        <AuthProvider>
          <StudentProvider>
            <RequirementsProvider>
              <EventsProvider>
                <PointsProvider>
                  <NotificationsProvider>
                    <AppContent />
                  </NotificationsProvider>
                </PointsProvider>
              </EventsProvider>
            </RequirementsProvider>
          </StudentProvider>
        </AuthProvider>
      </NotificationPrefProvider>
    </ThemeProvider>
  );
}
