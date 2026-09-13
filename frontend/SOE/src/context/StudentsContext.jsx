import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_STUDENTS } from "../data/students";

const STORAGE_KEY = "oasis_students";

const StudentsContext = createContext(null);

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_STUDENTS;
  } catch {
    return DEFAULT_STUDENTS;
  }
}

export function StudentsProvider({ children }) {
  const [students, setStudents] = useState(loadStudents);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const addStudent = (data) => {
    const id = data.studentId.trim();
    const exists = students.some(
      (s) => s.studentId.toLowerCase() === id.toLowerCase()
    );
    if (exists) {
      return { ok: false, message: "A student with this ID already exists." };
    }
    setStudents((prev) => [...prev, { ...data, studentId: id }]);
    return { ok: true };
  };

  const deleteStudents = (studentIds) => {
    const idSet = new Set(studentIds);
    setStudents((prev) => prev.filter((s) => !idSet.has(s.studentId)));
  };

  const importStudents = (rows) => {
    const existingIds = new Set(students.map((s) => s.studentId.toLowerCase()));
    const seenInBatch = new Set();
    const added = [];
    const skipped = [];

    rows.forEach((row) => {
      const idLower = row.studentId.toLowerCase();
      if (!row.studentId || !row.name) {
        skipped.push({ row, reason: "Missing Student ID or Name" });
        return;
      }
      if (existingIds.has(idLower) || seenInBatch.has(idLower)) {
        skipped.push({ row, reason: "Duplicate Student ID" });
        return;
      }
      seenInBatch.add(idLower);
      added.push(row);
    });

    if (added.length > 0) {
      setStudents((prev) => [...prev, ...added]);
    }

    return { added: added.length, skipped };
  };

  return (
    <StudentsContext.Provider
      value={{ students, addStudent, deleteStudents, importStudents }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) {
    throw new Error("useStudents must be used within a StudentsProvider");
  }
  return ctx;
}
