import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const RequirementsContext = createContext(null);

function completionId(studentId, requirementId) {
  return `${studentId}_${requirementId}`;
}

export function RequirementsProvider({ children }) {
  const [items, setItems] = useState([]);
  const [completions, setCompletions] = useState({});
  const [targetPoints, setTargetPoints] = useState(0);

  useEffect(() => {
    let unsubItems = null;
    let unsubCompletions = null;
    let unsubSettings = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      [unsubItems, unsubCompletions, unsubSettings].forEach((u) => u && u());

      if (!user) {
        setItems([]);
        setCompletions({});
        setTargetPoints(0);
        return;
      }

      unsubItems = onSnapshot(collection(db, "requirements"), (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      unsubCompletions = onSnapshot(collection(db, "studentRequirements"), (snapshot) => {
        const next = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (!data.completed) return;
          if (!next[data.studentId]) next[data.studentId] = new Set();
          next[data.studentId].add(data.requirementId);
        });
        setCompletions(next);
      });

      unsubSettings = onSnapshot(doc(db, "settings", "semester"), (snapshot) => {
        setTargetPoints(snapshot.exists() ? snapshot.data().targetPoints || 0 : 0);
      });
    });

    return () => {
      unsubscribeAuth();
      [unsubItems, unsubCompletions, unsubSettings].forEach((u) => u && u());
    };
  }, []);

  const addItem = async ({ title, pointValue, programFilter }) => {
    const trimmed = title.trim();
    if (!trimmed) return { ok: false, message: "Requirement name is required." };
    if (items.some((i) => i.title.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, message: "This requirement already exists." };
    }
    await addDoc(collection(db, "requirements"), {
      title: trimmed,
      pointValue: Number(pointValue) || 0,
      programFilter: programFilter || "ALL",
      createdAt: serverTimestamp(),
    });
    return { ok: true };
  };

  const updateItem = async (requirementId, { title, pointValue, programFilter }) => {
    const trimmed = (title || "").trim();
    if (!trimmed) return { ok: false, message: "Requirement name is required." };
    if (items.some((i) => i.id !== requirementId && i.title.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, message: "Another requirement already has this name." };
    }
    await updateDoc(doc(db, "requirements", requirementId), {
      title: trimmed,
      pointValue: Math.max(0, Number(pointValue) || 0),
      programFilter: programFilter || "ALL",
    });
    return { ok: true };
  };

  // Removing a requirement also removes every student's completion record for it.
  const deleteItem = async (requirementId) => {
    const completionsSnap = await getDocs(
      query(collection(db, "studentRequirements"), where("requirementId", "==", requirementId))
    );
    const batch = writeBatch(db);
    completionsSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "requirements", requirementId));
    await batch.commit();
  };

  const isCompleted = (studentId, requirementId) =>
    Boolean(completions[studentId]?.has(requirementId));

  const toggleCompleted = async (studentId, requirementId) => {
    const id = completionId(studentId, requirementId);
    if (isCompleted(studentId, requirementId)) {
      await deleteDoc(doc(db, "studentRequirements", id));
    } else {
      await setDoc(doc(db, "studentRequirements", id), {
        studentId,
        requirementId,
        completed: true,
        completedAt: serverTimestamp(),
      });
    }
  };

  // A requirement can be limited to one program; it only counts for students in it.
  const appliesTo = (item, course) =>
    !item.programFilter || item.programFilter === "ALL" || item.programFilter === course;

  const getRequirementPoints = (studentId, course) =>
    items.reduce(
      (sum, item) =>
        sum + (appliesTo(item, course) && isCompleted(studentId, item.id) ? item.pointValue : 0),
      0
    );

  return (
    <RequirementsContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        appliesTo,
        isCompleted,
        toggleCompleted,
        getRequirementPoints,
        targetPoints,
      }}
    >
      {children}
    </RequirementsContext.Provider>
  );
}

export function useRequirements() {
  const ctx = useContext(RequirementsContext);
  if (!ctx) {
    throw new Error("useRequirements must be used within a RequirementsProvider");
  }
  return ctx;
}
