import { useEffect, useRef, useState } from "react";
import { getEventPhase, scanLockMessage, todayLocal } from "../../../utils/events.js";
import CyberKiosk, { CyberKioskNotice } from "../../../components/common/CyberKiosk.jsx";
import aces_logo from "../../../assets/aceslogo.png";
import oasis_logo from "../../../assets/oasis-logo.png";
import { useStudents } from "../../../context/staff/StudentsContext";
import { useEvents, scanEventAttendance } from "../../../context/staff/EventsContext";
import { useStaffAuth } from "../../../context/staff/AuthContext";
import { currentPortal } from "../../../api/portal";
import { useReportLocation } from "../../../components/common/StaffPresenceTracker.jsx";

const IS_ADMIN = currentPortal() === "admin";

export default function StudentKioskView({ eventId, currentStaff, onExit }) {
  const { students } = useStudents();
  const { events } = useEvents();
  const { authenticate } = useStaffAuth();

  const [scanValue, setScanValue] = useState("");
  const [result, setResult] = useState(null);
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const inputRef = useRef(null);

  // The kiosk opens at the event's start time and closes when an admin closes the event;
  // it re-checks as the clock moves.
  const [today, setToday] = useState(todayLocal());
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setToday(todayLocal());
      setTick((t) => t + 1);
    }, 30000);
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
        buttonLabel={IS_ADMIN ? "Return to Admin" : "Return to Scanner"}
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
        buttonLabel={IS_ADMIN ? "Return to Admin" : "Return to Scanner"}
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

    let scanned;
    try {
      scanned = await scanEventAttendance(event.id, student.studentId);
    } catch (error) {
      // e.g. time out not open yet, or the event was just closed
      setResult({ id: Date.now(), type: "error", message: `${student.name}: ${error.message || "The scan did not go through."}` });
      setScanValue("");
      return;
    }
    const { action, record } = scanned;

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
    if (!currentStaff?.username) {
      setExitError("No staff session found.");
      return;
    }
    setIsExiting(true);
    const authResult = await authenticate(currentStaff.username, exitPassword);
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
        placeholder: IS_ADMIN ? "Admin password" : "Staff password",
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
