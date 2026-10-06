import { createContext, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const AuthContext = createContext(null);

// Student accounts are created by an admin (with a temporary password), so
// there is no self sign-up here.
export function AuthProvider({ children }) {
  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { ok: false, message: "Email and password are required." };
    }

    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } catch {
      return { ok: false, message: "Invalid email or password." };
    }

    const q = query(collection(db, "students"), where("authUid", "==", cred.user.uid));
    const snap = await getDocs(q);
    if (snap.empty) {
      await firebaseSignOut(auth);
      return { ok: false, message: "No student profile is linked to this account." };
    }
    const studentDoc = snap.docs[0];
    return { ok: true, student: { studentId: studentDoc.id, ...studentDoc.data() } };
  };

  const signOut = () => firebaseSignOut(auth);

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not send reset email. Check the address and try again." };
    }
  };

  return (
    <AuthContext.Provider value={{ login, signOut, forgotPassword }}>
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
