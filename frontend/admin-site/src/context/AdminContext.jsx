import { createContext, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const AdminContext = createContext(null);

// Staff accounts are separate from students: they sign in with a username
// (e.g. "admin"), never a student ID.
function staffEmailFor(username) {
  return `${username.trim().toLowerCase()}@oasis.local`;
}

export function AdminProvider({ children }) {
  const authenticate = async (username, password) => {
    const id = username.trim();
    if (!id || !password) {
      return { ok: false, message: "Invalid username or password." };
    }

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(
        auth,
        staffEmailFor(id),
        password
      );
    } catch {
      return { ok: false, message: "Invalid username or password." };
    }

    const staffSnap = await getDoc(doc(db, "staff", userCredential.user.uid));
    if (!staffSnap.exists()) {
      await firebaseSignOut(auth);
      return { ok: false, message: "This account is not authorized as staff." };
    }

    const staff = staffSnap.data();
    return {
      ok: true,
      admin: {
        uid: userCredential.user.uid,
        username: staff.username,
        name: staff.name,
        role: staff.role,
      },
    };
  };

  const signOut = () => firebaseSignOut(auth);

  return (
    <AdminContext.Provider value={{ authenticate, signOut }}>
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
