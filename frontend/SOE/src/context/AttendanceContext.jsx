import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "oasis_attendance";

const AttendanceContext = createContext(null);

function loadSheets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AttendanceProvider({ children }) {
  const [sheets, setSheets] = useState(loadSheets);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets]);

  const createSheet = ({ title, date, description }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return { ok: false, message: "Title is required." };
    }
    const sheet = {
      id: `${Date.now()}`,
      title: trimmedTitle,
      date,
      description: description?.trim() || "",
      records: {},
    };
    setSheets((prev) => [sheet, ...prev]);
    return { ok: true, sheet };
  };

  const deleteSheet = (sheetId) => {
    setSheets((prev) => prev.filter((s) => s.id !== sheetId));
  };

  const markPresent = (sheetId, studentId) => {
    setSheets((prev) =>
      prev.map((sheet) =>
        sheet.id === sheetId
          ? {
              ...sheet,
              records: {
                ...sheet.records,
                [studentId]: { timeIn: new Date().toISOString(), timeOut: null },
              },
            }
          : sheet
      )
    );
  };

  const markOut = (sheetId, studentId) => {
    setSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.id !== sheetId) return sheet;
        const existing = sheet.records[studentId];
        if (!existing) return sheet;
        return {
          ...sheet,
          records: {
            ...sheet.records,
            [studentId]: { ...existing, timeOut: new Date().toISOString() },
          },
        };
      })
    );
  };

  const unmarkPresent = (sheetId, studentId) => {
    setSheets((prev) =>
      prev.map((sheet) => {
        if (sheet.id !== sheetId) return sheet;
        const records = { ...sheet.records };
        delete records[studentId];
        return { ...sheet, records };
      })
    );
  };

  /**
   * Single-scan check-in/check-out: first scan records time in,
   * second scan (once already checked in) records time out.
   */
  const scanStudent = (sheetId, studentId) => {
    const sheet = sheets.find((s) => s.id === sheetId);
    if (!sheet) return { action: "not-found" };

    const existing = sheet.records[studentId];
    const now = new Date().toISOString();

    if (!existing) {
      const record = { timeIn: now, timeOut: null };
      setSheets((prev) =>
        prev.map((s) =>
          s.id === sheetId ? { ...s, records: { ...s.records, [studentId]: record } } : s
        )
      );
      return { action: "in", record };
    }

    if (!existing.timeOut) {
      const record = { ...existing, timeOut: now };
      setSheets((prev) =>
        prev.map((s) =>
          s.id === sheetId ? { ...s, records: { ...s.records, [studentId]: record } } : s
        )
      );
      return { action: "out", record };
    }

    return { action: "already", record: existing };
  };

  return (
    <AttendanceContext.Provider
      value={{
        sheets,
        createSheet,
        deleteSheet,
        markPresent,
        markOut,
        unmarkPresent,
        scanStudent,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return ctx;
}
