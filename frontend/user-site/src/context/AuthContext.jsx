import { createContext, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const signUp = async (studentId, email, password) => {
    const id = studentId.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!id || !trimmedEmail || !password) {
      return { ok: false, message: "All fields are required." };
    }

    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        return {
          ok: false,
          message: "An account with this email already exists. Try logging in.",
        };
      }
      return { ok: false, message: "Could not create account. Check your email and password." };
    }

    const studentRef = doc(db, "students", id);

    try {
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        await deleteUser(cred.user).catch(() => {});
        return {
          ok: false,
          message: "Student ID not found. Ask an officer to add you to the roster first.",
        };
      }
      if (studentSnap.data().authUid) {
        await deleteUser(cred.user).catch(() => {});
        return {
          ok: false,
          message: "This Student ID has already been registered. Try logging in instead.",
        };
      }

      await updateDoc(studentRef, { authUid: cred.user.uid, email: trimmedEmail });

      return {
        ok: true,
        student: {
          studentId: id,
          ...studentSnap.data(),
          authUid: cred.user.uid,
          email: trimmedEmail,
        },
      };
    } catch {
      await deleteUser(cred.user).catch(() => {});
      return { ok: false, message: "Could not link your account. Please try again." };
    }
  };

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
    <AuthContext.Provider value={{ signUp, login, signOut, forgotPassword }}>
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
