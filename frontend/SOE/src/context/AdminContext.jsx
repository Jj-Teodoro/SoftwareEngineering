import { createContext, useContext } from "react";
import { DEFAULT_ADMINS } from "../data/admins";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const authenticate = (studentId, password) => {
    const id = studentId.trim();
    const match = DEFAULT_ADMINS.find(
      (a) => a.studentId.toLowerCase() === id.toLowerCase()
    );

    if (!match || match.password !== password) {
      return { ok: false, message: "Invalid student ID or password." };
    }

    return { ok: true, admin: match };
  };

  return (
    <AdminContext.Provider value={{ authenticate }}>
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
