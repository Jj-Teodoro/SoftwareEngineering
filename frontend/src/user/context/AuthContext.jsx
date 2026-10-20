import { createContext, useContext } from "react";
import { api, login as apiLogin, logout } from "@oasis/shared/api/client.js";
import { toStudent } from "@oasis/shared/api/mappers.js";

const AuthContext = createContext(null);

// Student accounts are created by an admin with a temporary password, so there
// is no self sign-up. A forgotten password is handled by asking the admin for a
// new temporary one (requestTempPassword); there is no email reset.
export function AuthProvider({ children }) {
  const login = async (email, password) => {
    const typed = email.trim().toLowerCase();
    if (!typed || !password) {
      return { ok: false, message: "Email and password are required." };
    }

    try {
      const user = await apiLogin(typed, password, "student");
      return { ok: true, student: toStudent(user) };
    } catch (error) {
      return {
        ok: false,
        message: error.status === 401 ? "Invalid email or password." : "Unable to reach the server.",
      };
    }
  };

  const signOut = async () => logout();

  // Flags the student for the admin, who then gives them a new temporary password.
  const requestTempPassword = async (studentId) => {
    const id = studentId.trim();
    if (!id) return { ok: false, message: "Enter your Student ID." };
    try {
      await api.requestTempPassword(id);
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not send your request. Please try again." };
    }
  };

  return (
    <AuthContext.Provider value={{ login, signOut, requestTempPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
