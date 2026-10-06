import { createContext, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const AuthContext = createContext(null);

function staffEmailFor(studentId) {
  return `${studentId.trim().toLowerCase()}@oasis.local`;
}

export function AuthProvider({ children }) {
  const authenticate = async (studentId, password) => {
    const id = studentId.trim();
    if (!id || !password) {
      return { ok: false, message: "Invalid student ID or password." };
    }

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(
        auth,
        staffEmailFor(id),
        password
      );
    } catch {
      return { ok: false, message: "Invalid student ID or password." };
    }

    const staffSnap = await getDoc(doc(db, "staff", userCredential.user.uid));
    if (!staffSnap.exists()) {
      await firebaseSignOut(auth);
      return { ok: false, message: "This account is not authorized as staff." };
    }

    const staff = staffSnap.data();
    return {
      ok: true,
      staff: {
        uid: userCredential.user.uid,
        studentId: staff.studentId,
        name: staff.name,
        role: staff.role,
      },
    };
  };

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ authenticate, signOut }}>
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
