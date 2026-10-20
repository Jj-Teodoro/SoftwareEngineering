import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import { useSignedIn, usePolling } from "../../api/hooks.js";
import { fromStudent, toStudent } from "../../api/mappers.js";

const ADMIN_EDITABLE_FIELDS = [
  "name",
  "course",
  "yearLevel",
  "section",
  "status",
  "email",
  "contactNumber",
  "address",
];

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const StudentsContext = createContext(null);

function newStudentPayload(data) {
  return { ...fromStudent({ ...data, studentId: data.studentId.trim() }), role: "student" };
}

export function StudentsProvider({ children }) {
  const signedIn = useSignedIn();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = usePolling(
    async () => {
      const users = await api.users.list({ role: "student" });
      setStudents(users.map(toStudent));
      setLoading(false);
    },
    { enabled: signedIn }
  );

  // studentId -> when they asked for a new temporary password
  const resetRequests = useMemo(
    () =>
      Object.fromEntries(
        students.filter((s) => s.passwordRequestedAt).map((s) => [s.studentId, s.passwordRequestedAt])
      ),
    [students]
  );

  const addStudent = async (data) => {
    const id = data.studentId.trim();
    if (students.some((s) => s.studentId.toLowerCase() === id.toLowerCase())) {
      return { ok: false, message: "A student with this ID already exists." };
    }
    try {
      await api.users.create(newStudentPayload(data));
    } catch (error) {
      return { ok: false, message: error.data?.student_id ? "A student with this ID already exists." : error.message };
    }
    await refresh();
    return { ok: true };
  };

  const updateStudent = async (studentId, fields) => {
    const clean = {};
    ADMIN_EDITABLE_FIELDS.forEach((key) => {
      if (key in fields) {
        clean[key] = typeof fields[key] === "string" ? fields[key].trim() : fields[key];
      }
    });
    if ("name" in clean && !clean.name) {
      return { ok: false, message: "Name is required." };
    }
    try {
      await api.users.update(studentId, fromStudent(clean));
    } catch (error) {
      return { ok: false, message: error.message };
    }
    await refresh();
    return { ok: true };
  };

  // The server sets a random temporary password and returns it once; the student
  // signs in with their student number and must replace it on first login.
  const issueAccount = async (studentId) => {
    try {
      const { temp_password: tempPassword } = await api.users.issueAccount(studentId);
      await refresh();
      return { ok: true, tempPassword };
    } catch (error) {
      return { ok: false, message: error.message || "Could not create the account." };
    }
  };

  const provisionAccount = async (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student) return { ok: false, message: "Student not found." };
    if (student.authUid) return { ok: false, message: "This student already has an account." };
    return issueAccount(studentId);
  };

  const regenerateTempPassword = async (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student?.authUid || !student.mustChangePassword) {
      return { ok: false, message: "Only accounts waiting for a first login can get a new password." };
    }
    return issueAccount(studentId);
  };

  // Gives a student a new temporary password (they asked for one, or the admin is
  // replacing the one they were handed). This also clears their reset request.
  const issueTempPassword = async (studentId) => {
    const student = students.find((s) => s.studentId === studentId);
    if (!student?.authUid) return { ok: false, message: "This student has no account yet." };
    return issueAccount(studentId);
  };

  const dismissRequest = async (studentId) => {
    await api.users.dismissPasswordRequest(studentId);
    await refresh();
  };

  const provisionAccounts = async (studentIds, onProgress) => {
    const results = [];
    for (const id of studentIds) {
      const student = students.find((s) => s.studentId === id);
      const result = await provisionAccount(id);
      results.push({ studentId: id, name: student?.name || "", ...result });
      onProgress?.(results.length, studentIds.length);
    }
    return results;
  };

  // Removes the students along with their attendance, requirement progress and
  // notifications, so a student re-added later with the same ID starts fresh.
  const deleteStudents = async (studentIds) => {
    await api.users.bulkDelete(studentIds);
    await refresh();
  };

  const importStudents = async (rows) => {
    const existingIds = new Set(students.map((s) => s.studentId.toLowerCase()));
    const seenInBatch = new Set();
    const toAdd = [];
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
      if (row.email && !EMAIL_PATTERN.test(row.email.trim())) {
        skipped.push({ row, reason: "Invalid email" });
        return;
      }
      seenInBatch.add(idLower);
      toAdd.push(row);
    });

    if (toAdd.length > 0) {
      await api.users.bulkCreate(toAdd.map(newStudentPayload));
      await refresh();
    }

    return { added: toAdd.length, skipped };
  };

  return (
    <StudentsContext.Provider
      value={{
        students,
        loading,
        refresh,
        addStudent,
        updateStudent,
        deleteStudents,
        importStudents,
        provisionAccount,
        regenerateTempPassword,
        issueTempPassword,
        dismissRequest,
        resetRequests,
        provisionAccounts,
      }}
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
