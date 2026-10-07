import { createContext, useContext } from "react";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { normalizeUsername, resolveStaffLoginEmail, staffKey } from "@oasis/shared/utils/staffAuth.js";

const AuthContext = createContext(null);

const INVALID = { ok: false, message: "Invalid username or password." };

// Scanner accounts are created by an admin with a temporary password. A new or
// re-issued account must choose its own password on first sign-in, and a
// forgotten one is requested from the admin (there is no self-service reset).
export function AuthProvider({ children }) {
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
    return {
      ok: true,
      staff: {
        uid: userCredential.user.uid,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        mustChangePassword: Boolean(staff.mustChangePassword),
      },
    };
  };

  // After the staff member has set their own password.
  const completePasswordChange = async (staff) => {
    await updateDoc(doc(db, "staff", staff.uid), { mustChangePassword: false });
    await deleteDoc(doc(db, "accountCredentials", staffKey(staff.username))).catch(() => {});
  };

  // Flags the account for the admin, who then issues a new temporary password.
  const requestPassword = async (username) => {
    const id = normalizeUsername(username);
    if (!id) return { ok: false, message: "Enter your username." };
    try {
      await setDoc(doc(db, "passwordRequests", staffKey(id)), { requestedAt: serverTimestamp() });
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not send your request. Please try again." };
    }
  };

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ authenticate, signOut, completePasswordChange, requestPassword }}>
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
