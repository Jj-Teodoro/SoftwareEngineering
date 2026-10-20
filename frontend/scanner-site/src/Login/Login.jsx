import LoginScreen from "@oasis/shared/components/LoginScreen.jsx";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onLoginSuccess }) {
  const { authenticate, requestPassword } = useAuth();

  const handleLogin = async (username, password) => {
    const result = await authenticate(username, password);
    if (result.ok) onLoginSuccess?.(result.staff);
    return result;
  };

  return (
    <LoginScreen
      title="Scanner"
      logoSrc={oasis_logo}
      acesSrc={aces_logo}
      onLogin={handleLogin}
      onRequestReset={requestPassword}
    />
  );
}
