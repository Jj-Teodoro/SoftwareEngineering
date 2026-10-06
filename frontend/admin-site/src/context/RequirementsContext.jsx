import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
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

  const getRequirementPoints = (studentId) =>
    items.reduce(
      (sum, item) => sum + (isCompleted(studentId, item.id) ? item.pointValue : 0),
      0
    );

  return (
    <RequirementsContext.Provider
      value={{
        items,
        addItem,
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
