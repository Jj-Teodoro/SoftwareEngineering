import { createContext, useContext, useEffect, useState } from "react";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as signOutAuth,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "@oasis/shared/firebaseClient.js";

const ADMIN_EDITABLE_FIELDS = [
  "name",
  "course",
  "yearLevel",
  "section",
  "status",
  "email",
  "contactNumber",
  "address",
];

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generateTempPassword(length = 10) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => TEMP_PASSWORD_ALPHABET[b % TEMP_PASSWORD_ALPHABET.length]).join("");
}

const StudentsContext = createContext(null);

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore rules require an authenticated user, so don't subscribe until
    // Firebase Auth has actually signed someone in (avoids a permission-denied
    // listener that starts before login and never recovers).
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (!user) {
        setStudents([]);
        setLoading(false);
        return;
      }
      unsubscribeSnapshot = onSnapshot(collection(db, "students"), (snapshot) => {
        setStudents(snapshot.docs.map((d) => ({ studentId: d.id, ...d.data() })));
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const addStudent = async (data) => {
    const id = data.studentId.trim();
    const existing = await getDoc(doc(db, "students", id));
    if (existing.exists()) {
      return { ok: false, message: "A student with this ID already exists." };
    }
    await setDoc(doc(db, "students", id), {
      ...data,
      studentId: id,
      bio: "",
      hobbies: [],
      talent: "",
      authUid: null,
    });
    return { ok: true };
  };

  const updateStudent = async (studentId, fields) => {
    const clean = {};
    ADMIN_EDITABLE_FIELDS.forEach((key) => {
      if (key in fields) {
        clean[key] = typeof fields[key] === "string" ? fields[key].trim() : fields[key];
      }
    });
    if ("name" in clean && !clean.name) {
      return { ok: false, message: "Name is required." };
    }
    await updateDoc(doc(db, "students", studentId), clean);
    return { ok: true };
  };

  // Creates the student's login with a random temporary password. A second
  // Firebase app instance is used so the admin's own session is not replaced.
  // The password is returned once and never stored; the student must change it
  // on first login, after which no admin can see or change it.
  const provisionAccount = async (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student) return { ok: false, message: "Student not found." };
    if (student.authUid) return { ok: false, message: "This student already has an account." };

    const email = (student.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { ok: false, message: "Add a valid email to this student first." };
    }

    const tempPassword = generateTempPassword();
    const secondaryApp = initializeApp(
      firebaseConfig,
      `provision-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const secondaryAuth = getAuth(secondaryApp);

    try {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          return { ok: false, message: "That email is already used by another account." };
        }
        return { ok: false, message: "Could not create the account." };
      }

      // The temporary password is kept in an admin-only collection (never on the
      // student record, which every signed-in user can read) until the student
      // replaces it; the student's own client deletes it after that.
      try {
        await setDoc(doc(db, "accountCredentials", studentId), {
          tempPassword,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "students", studentId), {
          authUid: cred.user.uid,
          mustChangePassword: true,
        });
      } catch {
        await deleteDoc(doc(db, "accountCredentials", studentId)).catch(() => {});
        await deleteUser(cred.user).catch(() => {});
        return { ok: false, message: "Could not link the account to the student record." };
      }

      return { ok: true, email, tempPassword };
    } finally {
      await signOutAuth(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  };

  // While an account is still pending (the student hasn't replaced the temporary
  // password), the admin can issue a new one. Firebase doesn't let a browser
  // change someone else's password, so this signs in as the pending login with
  // the stored temporary password, deletes it, and creates a fresh login.
  // Once the student sets their own password the stored copy is gone, so this
  // can no longer be done.
  const regenerateTempPassword = async (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student?.authUid || !student.mustChangePassword) {
      return { ok: false, message: "Only accounts waiting for a first login can get a new password." };
    }

    let oldPassword;
    try {
      const credSnap = await getDoc(doc(db, "accountCredentials", studentId));
      oldPassword = credSnap.exists() ? credSnap.data().tempPassword : null;
    } catch {
      return { ok: false, message: "Could not read the current temporary password." };
    }
    if (!oldPassword) {
      return {
        ok: false,
        message: "The current temporary password isn't on file. The student can use Forgot password.",
      };
    }

    const email = (student.email || "").trim().toLowerCase();
    const newPassword = generateTempPassword();
    const secondaryApp = initializeApp(
      firebaseConfig,
      `regen-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const secondaryAuth = getAuth(secondaryApp);

    try {
      try {
        const old = await signInWithEmailAndPassword(secondaryAuth, email, oldPassword);
        await deleteUser(old.user);
      } catch {
        return {
          ok: false,
          message: "Couldn't replace the password. The student may have just changed it.",
        };
      }

      const resetLink = async () => {
        await updateDoc(doc(db, "students", studentId), {
          authUid: null,
          mustChangePassword: false,
        }).catch(() => {});
        await deleteDoc(doc(db, "accountCredentials", studentId)).catch(() => {});
      };

      let cred;
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, email, newPassword);
      } catch {
        await resetLink();
        return {
          ok: false,
          message: "The old login was removed but a new one couldn't be created. Use Create account to try again.",
        };
      }

      try {
        await setDoc(doc(db, "accountCredentials", studentId), {
          tempPassword: newPassword,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "students", studentId), {
          authUid: cred.user.uid,
          mustChangePassword: true,
        });
      } catch {
        await deleteUser(cred.user).catch(() => {});
        await resetLink();
        return {
          ok: false,
          message: "Could not save the new login. Use Create account to try again.",
        };
      }

      return { ok: true, email, tempPassword: newPassword };
    } finally {
      await signOutAuth(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  };

  const provisionAccounts = async (studentIds, onProgress) => {
    const results = [];
    for (const id of studentIds) {
      const student = students.find((s) => s.studentId === id);
      const result = await provisionAccount(id);
      results.push({ studentId: id, name: student?.name || "", ...result });
      onProgress?.(results.length, studentIds.length);
    }
    return results;
  };

  const deleteStudents = async (studentIds) => {
    const batch = writeBatch(db);
    studentIds.forEach((id) => {
      batch.delete(doc(db, "students", id));
      batch.delete(doc(db, "accountCredentials", id));
    });
    await batch.commit();
  };

  const importStudents = async (rows) => {
    const existingIds = new Set(students.map((s) => s.studentId.toLowerCase()));
    const seenInBatch = new Set();
    const toAdd = [];
    const skipped = [];

    rows.forEach((row) => {
      const idLower = row.studentId.toLowerCase();
      if (!row.studentId || !row.name) {
        skipped.push({ row, reason: "Missing Student ID or Name" });
        return;
      }
      if (existingIds.has(idLower) || seenInBatch.has(idLower)) {
        skipped.push({ row, reason: "Duplicate Student ID" });
        return;
      }
      seenInBatch.add(idLower);
      toAdd.push(row);
    });

    if (toAdd.length > 0) {
      const batch = writeBatch(db);
      toAdd.forEach((row) => {
        batch.set(doc(db, "students", row.studentId), {
          ...row,
          bio: "",
          hobbies: [],
          talent: "",
          authUid: null,
        });
      });
      await batch.commit();
    }

    return { added: toAdd.length, skipped };
  };

  return (
    <StudentsContext.Provider
      value={{
        students,
        loading,
        addStudent,
        updateStudent,
        deleteStudents,
        importStudents,
        provisionAccount,
        regenerateTempPassword,
        provisionAccounts,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) {
    throw new Error("useStudents must be used within a StudentsProvider");
  }
  return ctx;
}
