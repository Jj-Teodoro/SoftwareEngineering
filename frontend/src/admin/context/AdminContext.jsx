import { createContext, useContext } from "react";
import { api, hasSession, login, logout } from "@oasis/shared/api/client.js";
import { toStaff } from "@oasis/shared/api/mappers.js";

const AdminContext = createContext(null);

const STAFF_ROLES = ["admin", "scanner"];

// Staff accounts are separate from students: they sign in with a username
// (e.g. "admin"), never a student ID.
export function AdminProvider({ children }) {
  const authenticate = async (username, password) => {
    const id = username.trim();
    if (!id || !password) {
      return { ok: false, message: "Invalid username or password." };
    }

    try {
      const user = await login(id, password, "staff");
      return { ok: true, admin: toStaff(user) };
    } catch (error) {
      return {
        ok: false,
        message: error.status === 401 ? "Invalid username or password." : "Unable to reach the server.",
      };
    }
  };

  // Picks up the session saved in this browser, so a reload doesn't log staff out.
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
    <AdminContext.Provider value={{ authenticate, restoreSession, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}
