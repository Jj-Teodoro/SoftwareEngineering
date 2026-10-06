import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { useRequirements } from "./RequirementsContext";

const PointsContext = createContext(null);

export function PointsProvider({ children }) {
  const [eventPoints, setEventPoints] = useState({});
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const { getRequirementPoints, targetPoints } = useRequirements();

  useEffect(() => {
    let unsubscribeSnapshot = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (!user) {
        setEventPoints({});
        setAttendanceByStudent({});
        return;
      }
      unsubscribeSnapshot = onSnapshot(collection(db, "attendance"), (snapshot) => {
        const totals = {};
        const byStudent = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (!data.studentId) return;
          totals[data.studentId] = (totals[data.studentId] || 0) + (data.pointValue || 0);
          if (!byStudent[data.studentId]) byStudent[data.studentId] = [];
          byStudent[data.studentId].push(data);
        });
        setEventPoints(totals);
        setAttendanceByStudent(byStudent);
      });
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const getTotalPoints = (studentId) =>
    (eventPoints[studentId] || 0) + getRequirementPoints(studentId);

  const getClearance = (studentId) => {
    const totalPoints = getTotalPoints(studentId);
    return {
      totalPoints,
      targetPoints,
      cleared: targetPoints > 0 && totalPoints >= targetPoints,
    };
  };

  const getAttendanceRecords = (studentId) => attendanceByStudent[studentId] || [];

  return (
    <PointsContext.Provider
      value={{ getTotalPoints, getClearance, targetPoints, getAttendanceRecords }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return ctx;
}
