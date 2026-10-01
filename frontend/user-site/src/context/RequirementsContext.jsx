import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { useStudent } from "./StudentContext";

const RequirementsContext = createContext(null);

export function RequirementsProvider({ children }) {
  const { student } = useStudent();
  const [items, setItems] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [targetPoints, setTargetPoints] = useState(0);

  useEffect(() => {
    let unsubItems = null;
    let unsubSettings = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubItems) unsubItems();
      if (unsubSettings) unsubSettings();
      if (!user) {
        setItems([]);
        setTargetPoints(0);
        return;
      }
      unsubItems = onSnapshot(collection(db, "requirements"), (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      unsubSettings = onSnapshot(doc(db, "settings", "semester"), (snapshot) => {
        setTargetPoints(snapshot.exists() ? snapshot.data().targetPoints || 0 : 0);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubItems) unsubItems();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  useEffect(() => {
    if (!student) {
      setCompletedIds(new Set());
      return;
    }
    const q = query(
      collection(db, "studentRequirements"),
      where("studentId", "==", student.studentId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = new Set();
      snapshot.forEach((d) => {
        if (d.data().completed) next.add(d.data().requirementId);
      });
      setCompletedIds(next);
    });
    return unsubscribe;
  }, [student?.studentId]);

  const myItems = items.filter(
    (i) => !i.programFilter || i.programFilter === "ALL" || i.programFilter === student?.course
  );

  const isCompleted = (requirementId) => completedIds.has(requirementId);

  const completedPoints = myItems.reduce(
    (sum, i) => sum + (isCompleted(i.id) ? i.pointValue : 0),
    0
  );

  return (
    <RequirementsContext.Provider
      value={{ items: myItems, isCompleted, completedPoints, targetPoints }}
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
