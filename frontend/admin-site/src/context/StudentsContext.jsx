import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

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

  const deleteStudents = async (studentIds) => {
    const batch = writeBatch(db);
    studentIds.forEach((id) => batch.delete(doc(db, "students", id)));
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
      value={{ students, loading, addStudent, deleteStudents, importStudents }}
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
