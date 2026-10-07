import LoginScreen from "@oasis/shared/components/LoginScreen.jsx";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif";
import { useAdmin } from "../context/AdminContext";

export default function LoginPage({ onLoginSuccess }) {
  const { authenticate } = useAdmin();

  const handleLogin = async (username, password) => {
    const result = await authenticate(username, password);
    if (result.ok) onLoginSuccess?.(result.admin);
    return result;
  };

  return (
    <LoginScreen title="Admin console" logoSrc={oasis_logo} acesSrc={aces_logo} onLogin={handleLogin} />
  );
}
