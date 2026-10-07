import { createContext, useContext } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { resolveStaffLoginEmail } from "@oasis/shared/utils/staffAuth.js";

const AdminContext = createContext(null);

const INVALID = { ok: false, message: "Invalid username or password." };

export function AdminProvider({ children }) {
  // Only accounts with the admin role may use the admin site; scanner accounts
  // sign in on the scanner site.
  const authenticate = async (username, password) => {
    const id = username.trim();
    if (!id || !password) return INVALID;

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, await resolveStaffLoginEmail(db, id), password);
    } catch {
      return INVALID;
    }

    const staffSnap = await getDoc(doc(db, "staff", userCredential.user.uid));
    if (!staffSnap.exists()) {
      await firebaseSignOut(auth);
      return { ok: false, message: "This account is not authorized as staff." };
    }

    const staff = staffSnap.data();
    if (staff.role !== "admin") {
      await firebaseSignOut(auth);
      return { ok: false, message: "This account can't use the admin site. Use the scanner site instead." };
    }

    return {
      ok: true,
      admin: { uid: userCredential.user.uid, username: staff.username, name: staff.name, role: staff.role },
    };
  };

  const signOut = () => firebaseSignOut(auth);

  return <AdminContext.Provider value={{ authenticate, signOut }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return ctx;
}
