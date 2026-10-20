import { createContext, useContext } from "react";
import { api, hasSession, login, logout } from "../../api/client";
import { toStaff } from "../../api/mappers";

const StaffAuthContext = createContext(null);

const STAFF_ROLES = ["admin", "scanner"];

// Staff accounts (admins and scanners) are separate from students: they sign in
// with a username (e.g. "admin"), never a student ID.
export function StaffAuthProvider({ children }) {
  const authenticate = async (username, password) => {
    const id = username.trim();
    if (!id || !password) {
      return { ok: false, message: "Invalid username or password." };
    }

    try {
      const user = await login(id, password, "staff");
      return { ok: true, staff: toStaff(user) };
    } catch (error) {
      return {
        ok: false,
        message: error.status === 401 ? "Invalid username or password." : "Unable to reach the server.",
      };
    }
  };

  // Picks up the session saved in this browser, so a reload keeps staff signed in.
  const restoreSession = async () => {
    if (!hasSession()) return null;
    try {
      const user = await api.me();
      if (STAFF_ROLES.includes(user.role)) return toStaff(user);
    } catch {
      // expired or invalid; fall through to the login page
    }
    logout();
    return null;
  };

  const signOut = async () => logout();

  return (
    <StaffAuthContext.Provider value={{ authenticate, restoreSession, signOut }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return ctx;
}
