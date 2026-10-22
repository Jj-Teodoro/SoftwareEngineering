import LoginScreen from "../../../components/common/LoginScreen.jsx";
import aces_logo from "../../../assets/aceslogo.png";
import oasis_logo from "../../../assets/oasislogo.gif";
import { useStaffAuth } from "../../../context/staff/AuthContext";
import { currentPortal } from "../../../api/portal";

export default function LoginPage({ onLoginSuccess }) {
  const { authenticate, requestPassword } = useStaffAuth();
  const isAdmin = currentPortal() === "admin";

  const handleLogin = async (username, password) => {
    const result = await authenticate(username, password);
    if (result.ok) onLoginSuccess?.(result.staff);
    return result;
  };

  return (
    <LoginScreen
      title={isAdmin ? "Admin console" : "Scanner"}
      logoSrc={oasis_logo}
      acesSrc={aces_logo}
      onLogin={handleLogin}
      // staff ask an admin for a new temporary password
      onRequestReset={requestPassword}
    />
  );
}
