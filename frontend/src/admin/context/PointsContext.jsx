import { createContext, useContext, useState } from "react";
import { api } from "@oasis/shared/api/client.js";
import { useSignedIn, usePolling } from "@oasis/shared/api/hooks.js";
import { toAttendance } from "@oasis/shared/api/mappers.js";
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

  const signedIn = useSignedIn();

  usePolling(
    async () => {
      const records = (await api.attendance.list()).map(toAttendance);
      const totals = {};
      const byStudent = {};
      records.forEach((data) => {
        if (!data.studentId) return;
        totals[data.studentId] = (totals[data.studentId] || 0) + (data.pointValue || 0);
        if (!byStudent[data.studentId]) byStudent[data.studentId] = [];
        byStudent[data.studentId].push(data);
      });
      setEventPoints(totals);
      setAttendanceByStudent(byStudent);
      setAttendanceRecords(records);
    },
    { enabled: signedIn }
  );

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
