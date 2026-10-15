import { useEffect, useState } from "react";
import LoginPage from "./Login/Login";
import DashboardShell from "./Dashboard/DashboardShell";
import { hasSession, logout } from "./api/client";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);

  useEffect(() => {
    // the API client fires this when the refresh token has expired
    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener("oasis:logout", handleLogout);
    return () => window.removeEventListener("oasis:logout", handleLogout);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <DashboardShell onLogout={logout} />;
}
