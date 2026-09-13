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

  return (
    <StudentsContext.Provider value={{ students, addStudent, deleteStudents }}>
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
