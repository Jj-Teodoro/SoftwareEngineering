import { createContext, useContext } from "react";
import { api, hasSession, login, logout } from "../../api/client";
import { toStaff } from "../../api/mappers";
import { currentPortal } from "../../api/portal";

const StaffAuthContext = createContext(null);

const INVALID = { ok: false, message: "Invalid username or password." };

// Staff accounts (admins and scanners) are separate from students: they sign in
// with a username (e.g. "admin"), never a student ID. The admin portal accepts
// admins only; the scanner portal accepts any staff account. Scanner accounts are
// created by an admin with a temporary password, must choose their own on first
// sign-in, and ask the admin for a new one if they forget it.
export function StaffAuthProvider({ children }) {
  const portal = currentPortal();
  const allowedRoles = portal === "admin" ? ["admin"] : ["admin", "scanner"];

  const authenticate = async (username, password) => {
    const id = username.trim();
    if (!id || !password) return INVALID;

    try {
      const user = await login(id, password, portal);
      return { ok: true, staff: toStaff(user) };
    } catch (error) {
      if (error.status !== 401) return { ok: false, message: "Unable to reach the server." };
      return portal === "admin"
        ? { ok: false, message: "Invalid username or password. Scanner accounts sign in at /scanner." }
        : INVALID;
    }
  };

  // Picks up the session saved in this browser, so a reload keeps staff signed in.
  const restoreSession = async () => {
    if (!hasSession()) return null;
    try {
      const user = await api.me();
      if (allowedRoles.includes(user.role)) return toStaff(user);
    } catch {
      // expired or invalid; fall through to the login page
    }
    logout();
    return null;
  };

  // Flags the account for the admin, who then issues a new temporary password.
  const requestPassword = async (username) => {
    const id = username.trim();
    if (!id) return { ok: false, message: "Enter your username." };
    try {
      await api.requestTempPassword(id);
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not send your request. Please try again." };
    }
  };

  const signOut = async () => logout();

  return (
    <StaffAuthContext.Provider value={{ authenticate, restoreSession, requestPassword, signOut }}>
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
