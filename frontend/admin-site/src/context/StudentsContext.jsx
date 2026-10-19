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
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// A student's login after a reset: same address with a version tag, e.g.
// juan@school.edu -> juan+oasis2@school.edu. Students keep typing their normal
// email; the login page maps it to this one (see loginAliases).
function aliasEmail(email, version) {
  const [local, domain] = email.split("@");
  return `${local}+oasis${version}@${domain}`;
}

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
  const [resetRequests, setResetRequests] = useState({});

  useEffect(() => {
    // Firestore rules require an authenticated user, so don't subscribe until
    // Firebase Auth has actually signed someone in (avoids a permission-denied
    // listener that starts before login and never recovers).
    let unsubscribeSnapshot = null;
    let unsubscribeRequests = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (unsubscribeRequests) {
        unsubscribeRequests();
        unsubscribeRequests = null;
      }
      if (!user) {
        setStudents([]);
        setResetRequests({});
        setLoading(false);
        return;
      }
      unsubscribeSnapshot = onSnapshot(collection(db, "students"), (snapshot) => {
        setStudents(snapshot.docs.map((d) => ({ studentId: d.id, ...d.data() })));
        setLoading(false);
      });
      unsubscribeRequests = onSnapshot(
        collection(db, "passwordRequests"),
        (snapshot) => {
          const next = {};
          snapshot.forEach((d) => {
            next[d.id] = d.data().requestedAt?.toMillis?.() ?? Date.now();
          });
          setResetRequests(next);
        },
        () => setResetRequests({})
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (unsubscribeRequests) unsubscribeRequests();
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
          loginEmail: email,
          loginVersion: 1,
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
        code: "no-credential",
        message: "The current temporary password isn't on file.",
      };
    }

    const email = (student.email || "").trim().toLowerCase();
    const loginEmail = (student.loginEmail || student.email || "").trim().toLowerCase();
    const newPassword = generateTempPassword();
    const secondaryApp = initializeApp(
      firebaseConfig,
      `regen-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const secondaryAuth = getAuth(secondaryApp);

    try {
      try {
        const old = await signInWithEmailAndPassword(secondaryAuth, loginEmail, oldPassword);
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
        cred = await createUserWithEmailAndPassword(secondaryAuth, loginEmail, newPassword);
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

  // For a student who already chose their own password (which nobody can read or
  // reset from a browser): create a fresh login with a new temporary password
  // and point the student record at it. The old login stays in Firebase
  // Authentication but is no longer linked to anything, so it can't be used.
  const rotateLogin = async (student) => {
    const studentId = student.studentId;
    const realEmail = (student.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(realEmail)) {
      return { ok: false, message: "Add a valid email to this student first." };
    }
    const version = (student.loginVersion || 1) + 1;
    const newLogin = aliasEmail(realEmail, version);
    const newPassword = generateTempPassword();

    const secondaryApp = initializeApp(
      firebaseConfig,
      `rotate-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const secondaryAuth = getAuth(secondaryApp);

    try {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, newLogin, newPassword);
      } catch {
        return { ok: false, message: "Could not create the new login." };
      }

      const previous = {
        authUid: student.authUid,
        mustChangePassword: Boolean(student.mustChangePassword),
        loginEmail: student.loginEmail || realEmail,
        loginVersion: student.loginVersion || 1,
      };

      try {
        await setDoc(doc(db, "accountCredentials", studentId), {
          tempPassword: newPassword,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "students", studentId), {
          authUid: cred.user.uid,
          mustChangePassword: true,
          loginEmail: newLogin,
          loginVersion: version,
        });
        await setDoc(doc(db, "loginAliases", await sha256Hex(realEmail)), {
          authEmail: newLogin,
        });
      } catch {
        await updateDoc(doc(db, "students", studentId), previous).catch(() => {});
        await deleteDoc(doc(db, "accountCredentials", studentId)).catch(() => {});
        await deleteUser(cred.user).catch(() => {});
        return { ok: false, message: "Could not save the new login. Nothing was changed." };
      }

      return { ok: true, email: realEmail, tempPassword: newPassword };
    } finally {
      await signOutAuth(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  };

  // Gives a student a new temporary password (they asked for one, or the
  // admin is replacing the one they were handed). The student must then
  // choose their own password again on first login.
  const issueTempPassword = async (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student?.authUid) return { ok: false, message: "This student has no account yet." };

    let result;
    if (student.mustChangePassword) {
      result = await regenerateTempPassword(studentId);
      if (!result.ok && result.code === "no-credential") result = await rotateLogin(student);
    } else {
      result = await rotateLogin(student);
    }

    if (result.ok) {
      await deleteDoc(doc(db, "passwordRequests", studentId)).catch(() => {});
    }
    return result;
  };

  const dismissRequest = (studentId) => deleteDoc(doc(db, "passwordRequests", studentId));

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

  // A login that was never used (still on its temporary password) can be removed
  // from Authentication so the email is free to reuse. Logins the student has
  // already taken over can't be deleted from a browser and are simply unlinked.
  const removePendingLogin = async (student) => {
    if (!student?.authUid || !student.mustChangePassword) return;
    const stored = await getDoc(doc(db, "accountCredentials", student.studentId)).catch(() => null);
    const tempPassword = stored?.exists() ? stored.data().tempPassword : null;
    if (!tempPassword) return;

    const secondaryApp = initializeApp(
      firebaseConfig,
      `remove-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const loginEmail = (student.loginEmail || student.email || "").trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(secondaryAuth, loginEmail, tempPassword);
      await deleteUser(cred.user);
    } catch {
      // best effort: the student record is removed either way
    } finally {
      await signOutAuth(secondaryAuth).catch(() => {});
      await deleteApp(secondaryApp).catch(() => {});
    }
  };

  // Removes the student and everything keyed to them, so a student re-added later
  // with the same ID does not inherit old attendance or requirement progress.
  const deleteStudents = async (studentIds) => {
    const refs = [];
    for (const id of studentIds) {
      const student = students.find((s) => s.studentId === id);
      await removePendingLogin(student);

      refs.push(
        doc(db, "students", id),
        doc(db, "accountCredentials", id),
        doc(db, "presence", id),
        doc(db, "passwordRequests", id)
      );
      if (student?.email) {
        refs.push(doc(db, "loginAliases", await sha256Hex(student.email.trim().toLowerCase())));
      }
      const [attendance, progress] = await Promise.all([
        getDocs(query(collection(db, "attendance"), where("studentId", "==", id))),
        getDocs(query(collection(db, "studentRequirements"), where("studentId", "==", id))),
      ]);
      attendance.forEach((d) => refs.push(d.ref));
      progress.forEach((d) => refs.push(d.ref));
    }

    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
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
        issueTempPassword,
        dismissRequest,
        resetRequests,
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
