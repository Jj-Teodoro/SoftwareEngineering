import { useEffect, useRef, useState } from "react";
import { FiLock, FiUser } from "react-icons/fi";
import PageBackground from "../components/PageBackground";
import aces_logo from "../assets/aceslogo.png";
import oasis_logo from "../assets/oasislogo.gif";
import { useStudents } from "../context/StudentsContext";
import { useAttendance } from "../context/AttendanceContext";
import { useAdmin } from "../context/AdminContext";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentKioskView({ sheetId, currentAdmin, onExit }) {
  const { students } = useStudents();
  const { sheets, scanStudent } = useAttendance();
  const { authenticate } = useAdmin();

  const [scanValue, setScanValue] = useState("");
  const [result, setResult] = useState(null);
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const inputRef = useRef(null);

  const sheet = sheets.find((s) => s.id === sheetId);

  useEffect(() => {
    if (!showExitForm) inputRef.current?.focus();
  }, [showExitForm, result]);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), 6000);
    return () => clearTimeout(timer);
  }, [result]);

  if (!sheet) {
    return (
      <PageBackground>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
          <p className="text-lg font-bold uppercase tracking-[2px]">
            This attendance session has ended.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-[#97191d] px-8 py-3 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25]"
          >
            Return to Admin
          </button>
        </div>
      </PageBackground>
    );
  }

  const handleScan = () => {
    const id = scanValue.trim();
    if (!id) return;

    const student = students.find(
      (s) => s.studentId.toLowerCase() === id.toLowerCase()
    );

    if (!student) {
      setResult({ type: "error", message: "ID not recognized. Please see an officer." });
      setScanValue("");
      return;
    }

    const { action, record } = scanStudent(sheet.id, student.studentId);

    setResult({
      type: action === "already" ? "info" : "success",
      student,
      action,
      record,
    });
    setScanValue("");
  };

  const handleExitSubmit = async () => {
    if (!currentAdmin?.studentId) {
      setExitError("No admin session found.");
      return;
    }
    setIsExiting(true);
    const result = await authenticate(currentAdmin.studentId, exitPassword);
    setIsExiting(false);
    if (!result.ok) {
      setExitError("Incorrect password.");
      return;
    }
    setExitError("");
    setExitPassword("");
    setShowExitForm(false);
    onExit();
  };

  return (
    <PageBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <img
          src={oasis_logo}
          alt="OASIS Logo"
          className="mb-6 h-auto max-w-[220px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        />

        <div className="w-full max-w-lg rounded-[30px] border border-white/20 bg-white/10 px-8 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <h2 className="text-center text-lg font-bold uppercase tracking-[2px] text-white">
            {sheet.title}
          </h2>
          <p className="mt-1 text-center text-xs text-white/60">{sheet.date}</p>

          <div className="mt-8">
            <label className="mb-2 block text-center text-xs font-bold uppercase tracking-[2px] text-white/70">
              Tap / Scan Your Student ID
            </label>
            <input
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleScan();
              }}
              placeholder="Enter your Student ID"
              className="h-16 w-full rounded-xl border border-white/30 bg-black/30 px-5 text-center text-xl text-white placeholder-white/40 outline-none focus:border-white/60"
              autoFocus
            />
          </div>

          {result && (
            <div
              className={`mt-6 rounded-2xl border px-6 py-5 text-center ${
                result.type === "success"
                  ? "border-green-400/40 bg-green-500/15"
                  : result.type === "info"
                  ? "border-blue-400/40 bg-blue-500/15"
                  : "border-red-400/40 bg-red-500/15"
              }`}
            >
              {result.student ? (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#97191d]">
                    <FiUser className="text-white" size={22} />
                  </div>
                  <p className="text-base font-bold uppercase tracking-[1px] text-white">
                    {result.student.name}
                  </p>
                  <p className="text-sm text-white/70">{result.student.section}</p>
                  <div className="mx-auto mt-3 flex max-w-[220px] justify-between text-sm text-white/90">
                    <span>Time In</span>
                    <span className="font-semibold">{formatTime(result.record.timeIn)}</span>
                  </div>
                  {result.record.timeOut && (
                    <div className="mx-auto mt-1 flex max-w-[220px] justify-between text-sm text-white/90">
                      <span>Time Out</span>
                      <span className="font-semibold">{formatTime(result.record.timeOut)}</span>
                    </div>
                  )}
                  <p className="mt-3 text-xs font-bold uppercase tracking-[1px] text-white/60">
                    {result.action === "in" && "Welcome! You're checked in."}
                    {result.action === "out" && "Thank you! You're checked out."}
                    {result.action === "already" && "You're already checked out."}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-red-200">{result.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Officer exit */}
        <div className="mt-8">
          {!showExitForm ? (
            <button
              type="button"
              onClick={() => setShowExitForm(true)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[1px] text-white/40 transition-colors hover:text-white/70"
            >
              <FiLock size={12} /> Officer Exit
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2">
              <input
                type="password"
                value={exitPassword}
                onChange={(e) => {
                  setExitPassword(e.target.value);
                  setExitError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExitSubmit();
                }}
                placeholder="Admin password"
                autoFocus
                className="h-9 w-40 bg-transparent text-sm text-white placeholder-white/40 outline-none"
              />
              <button
                type="button"
                onClick={handleExitSubmit}
                disabled={isExiting}
                className="rounded-full bg-[#97191d] px-4 py-1.5 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
              >
                Exit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitForm(false);
                  setExitPassword("");
                  setExitError("");
                }}
                className="text-xs font-bold uppercase tracking-[1px] text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
          {exitError && (
            <p className="mt-2 text-center text-xs font-semibold text-red-300">{exitError}</p>
          )}
        </div>

        <img
          src={aces_logo}
          alt="ACES Logo"
          className="mt-10 h-auto max-w-[80px] object-contain opacity-60"
        />
      </div>
    </PageBackground>
  );
}
