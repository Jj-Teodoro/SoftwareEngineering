import { useEffect, useRef, useState } from "react";
import { getEventPhase, scanLockMessage, todayLocal } from "@oasis/shared/utils/events.js";
import CyberKiosk, { CyberKioskNotice } from "@oasis/shared/components/CyberKiosk.jsx";
import { useReportLocation } from "@oasis/shared/components/StaffPresenceTracker.jsx";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif";
import { useStudents } from "../context/StudentsContext";
import { useEvents, scanEventAttendance } from "../context/EventsContext";
import { useAdmin } from "../context/AdminContext";

export default function StudentKioskView({ eventId, currentAdmin, onExit }) {
  const { students } = useStudents();
  const { events } = useEvents();
  const { authenticate } = useAdmin();

  const [scanValue, setScanValue] = useState("");
  const [result, setResult] = useState(null);
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const inputRef = useRef(null);

  // The kiosk only accepts scans on the event's own day, and re-checks as the
  // clock moves so it closes by itself after midnight.
  const [today, setToday] = useState(todayLocal());
  useEffect(() => {
    const timer = setInterval(() => setToday(todayLocal()), 30000);
    return () => clearInterval(timer);
  }, []);

  const event = events.find((e) => e.id === eventId);
  const isRestricted = event?.programFilter && event.programFilter !== "ALL";
  useReportLocation("Kiosk", event?.title || "");

  useEffect(() => {
    if (!showExitForm) inputRef.current?.focus();
  }, [showExitForm, result]);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), 6000);
    return () => clearTimeout(timer);
  }, [result]);

  if (!event) {
    return (
      <CyberKioskNotice
        logoSrc={oasis_logo}
        title="This attendance session has ended."
        buttonLabel="Return to Admin"
        onExit={onExit}
      />
    );
  }

  if (getEventPhase(event, today) !== "today") {
    return (
      <CyberKioskNotice
        logoSrc={oasis_logo}
        title={event.title}
        message={scanLockMessage(event, today)}
        buttonLabel="Return to Admin"
        onExit={onExit}
      />
    );
  }

  const handleScan = async () => {
    const id = scanValue.trim();
    if (!id) return;

    const student = students.find((s) => s.studentId.toLowerCase() === id.toLowerCase());

    if (!student) {
      setResult({
        id: Date.now(),
        type: "error",
        message: "ID not recognized. Please see an officer.",
      });
      setScanValue("");
      return;
    }

    if (isRestricted && student.course !== event.programFilter) {
      setResult({
        id: Date.now(),
        type: "error",
        message: `This event is only for ${event.programFilter} students.`,
      });
      setScanValue("");
      return;
    }

    const { action, record } = await scanEventAttendance(event.id, student.studentId);

    setResult({
      id: Date.now(),
      type: action === "already" ? "info" : "success",
      student,
      action,
      record,
    });
    setScanValue("");
  };

  const handleExitSubmit = async () => {
    if (!currentAdmin?.username) {
      setExitError("No admin session found.");
      return;
    }
    setIsExiting(true);
    const authResult = await authenticate(currentAdmin.username, exitPassword);
    setIsExiting(false);
    if (!authResult.ok) {
      setExitError("Incorrect password.");
      return;
    }
    setExitError("");
    setExitPassword("");
    setShowExitForm(false);
    onExit();
  };

  return (
    <CyberKiosk
      event={event}
      logoSrc={oasis_logo}
      acesSrc={aces_logo}
      scanValue={scanValue}
      onScanValueChange={setScanValue}
      onScan={handleScan}
      inputRef={inputRef}
      result={result}
      exit={{
        show: showExitForm,
        password: exitPassword,
        error: exitError,
        busy: isExiting,
        placeholder: "Admin password",
        onOpen: () => setShowExitForm(true),
        onPasswordChange: (value) => {
          setExitPassword(value);
          setExitError("");
        },
        onSubmit: handleExitSubmit,
        onCancel: () => {
          setShowExitForm(false);
          setExitPassword("");
          setExitError("");
        },
      }}
    />
  );
}
