import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { useEvents } from "./EventsContext";
import { useRequirements } from "./RequirementsContext";
import { useStudents } from "./StudentsContext";

const PointsContext = createContext(null);

export function PointsProvider({ children }) {
  const [eventPoints, setEventPoints] = useState({});
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const { items, appliesTo, getRequirementPoints } = useRequirements();
  const { events } = useEvents();
  const { students } = useStudents();

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
        setAttendanceRecords([]);
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
        setAttendanceRecords(snapshot.docs.map((d) => d.data()));
      });
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const getTotalPoints = (studentId) =>
    (eventPoints[studentId] || 0) +
    getRequirementPoints(studentId, students.find((s) => s.studentId === studentId)?.course);

  // What a student has to earn to be cleared: every requirement and event that
  // applies to their program (events open to all programs, or to theirs).
  const getTargetPoints = (studentId) => {
    const course = students.find((s) => s.studentId === studentId)?.course;
    const fromRequirements = items
      .filter((item) => appliesTo(item, course))
      .reduce((sum, item) => sum + (item.pointValue || 0), 0);
    const fromEvents = events
      .filter((e) => !e.programFilter || e.programFilter === "ALL" || e.programFilter === course)
      .reduce((sum, e) => sum + (e.pointValue || 0), 0);
    return fromRequirements + fromEvents;
  };

  const getClearance = (studentId) => {
    const targetPoints = getTargetPoints(studentId);
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
      value={{ getTotalPoints, getClearance, getTargetPoints, getAttendanceRecords, attendanceRecords }}
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
