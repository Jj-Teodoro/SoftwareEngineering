import { createContext, useContext } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const AuthContext = createContext(null);

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Student accounts are created by an admin with a temporary password, so there
// is no self sign-up. A forgotten password is handled by asking the admin for a
// new temporary one (requestTempPassword); there is no email reset.
export function AuthProvider({ children }) {
  const login = async (email, password) => {
    const typed = email.trim().toLowerCase();
    if (!typed || !password) {
      return { ok: false, message: "Email and password are required." };
    }

    // After an admin re-issues a login, the student still types their normal
    // email; a small public lookup points it at their current login.
    let authEmail = typed;
    try {
      const alias = await getDoc(doc(db, "loginAliases", await sha256Hex(typed)));
      if (alias.exists()) authEmail = alias.data().authEmail;
    } catch {
      // no alias; use the email as typed
    }

    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, authEmail, password);
    } catch {
      return { ok: false, message: "Invalid email or password." };
    }

    const q = query(collection(db, "students"), where("authUid", "==", cred.user.uid));
    const snap = await getDocs(q);
    if (snap.empty) {
      await firebaseSignOut(auth);
      return { ok: false, message: "Invalid email or password." };
    }
    const studentDoc = snap.docs[0];
    return { ok: true, student: { studentId: studentDoc.id, ...studentDoc.data() } };
  };

  const signOut = () => firebaseSignOut(auth);

  // Flags the student for the admin, who then gives them a new temporary password.
  const requestTempPassword = async (studentId) => {
    const id = studentId.trim();
    if (!id) return { ok: false, message: "Enter your Student ID." };
    try {
      await setDoc(doc(db, "passwordRequests", id), { requestedAt: serverTimestamp() });
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
