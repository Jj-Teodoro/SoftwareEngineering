import { createContext, useContext, useMemo, useState } from "react";
import { api, rowErrors } from "../../api/client.js";
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

const IMPORT_BATCH = 400;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const StudentsContext = createContext(null);

function newStudentPayload(data) {
  return { ...fromStudent({ ...data, studentId: data.studentId.trim() }), role: "student" };
}

const ACCOUNT_BATCH = 250;

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

  // Makes a student a scanner or an admin. The student list is not reloaded here (they would
  // vanish from it at once); call refreshStudents when the admin is done reading the result.
  const setRole = async (studentId, role) => {
    try {
      const { temp_password: tempPassword } = await api.users.setRole(studentId, role);
      return { ok: true, tempPassword };
    } catch (error) {
      return { ok: false, message: error.message || "Could not change the role." };
    }
  };

  const dismissRequest = async (studentId) => {
    await api.users.dismissPasswordRequest(studentId);
    await refresh();
  };

  // Creates logins for many students, ACCOUNT_BATCH per request, and reloads the
  // student list once at the end (not after every student).
  const provisionAccounts = async (studentIds, onProgress) => {
    const nameOf = Object.fromEntries(students.map((s) => [s.studentId, s.name]));
    const results = [];
    const batches = Math.ceil(studentIds.length / ACCOUNT_BATCH);
    try {
      for (let i = 0; i < studentIds.length; i += ACCOUNT_BATCH) {
        const batch = studentIds.slice(i, i + ACCOUNT_BATCH);
        onProgress?.(results.length, studentIds.length, i / ACCOUNT_BATCH + 1, batches);
        try {
          const { created, skipped } = await api.users.bulkAccounts(batch);
          created.forEach((r) =>
            results.push({ studentId: r.student_id, name: nameOf[r.student_id] || "", ok: true, tempPassword: r.temp_password })
          );
          skipped.forEach((r) =>
            results.push({ studentId: r.student_id, name: nameOf[r.student_id] || "", ok: false, message: r.reason })
          );
        } catch (error) {
          batch.forEach((studentId) =>
            results.push({ studentId, name: nameOf[studentId] || "", ok: false, message: error.message || "Could not create the account." })
          );
        }
        onProgress?.(results.length, studentIds.length, i / ACCOUNT_BATCH + 1, batches);
      }
    } finally {
      await refresh();
    }
    return results;
  };

  // Removes the students along with their attendance, requirement progress and
  // notifications, so a student re-added later with the same ID starts fresh.
  // Removes every student (only students; admins and scanners stay).
  const deleteAllStudents = async () => {
    try {
      const { deleted } = await api.users.deleteAllStudents();
      return { ok: true, deleted };
    } catch (error) {
      return { ok: false, message: error.message || "Could not delete the students." };
    } finally {
      await refresh();
    }
  };

  const deleteStudents = async (studentIds) => {
    await api.users.bulkDelete(studentIds);
    await refresh();
  };

  // onProgress({ added, total, batch, batches, stage }) is called as each batch goes up,
  // so the Import page can show how far along it is.
  const importStudents = async (rows, onProgress) => {
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

    // the API takes at most 500 students per request, so a big class list goes up in batches
    let added = 0;
    const total = toAdd.length;
    const batches = Math.ceil(total / IMPORT_BATCH);
    try {
      for (let i = 0; i < total; i += IMPORT_BATCH) {
        let batch = toAdd.slice(i, i + IMPORT_BATCH);
        onProgress?.({ added, total, batch: i / IMPORT_BATCH + 1, batches, stage: "sending" });
        try {
          await api.users.bulkCreate(batch.map(newStudentPayload));
        } catch (error) {
          // The server rejects the whole batch if any row is invalid (an ID already used by
          // another account, a name or section that is too long...) and says which rows.
          // Skip just those rows, with the reason, and send the rest again.
          const rejected = error.status === 400 ? rowErrors(error.data) : [];
          if (rejected.length === 0) throw error;
          const bad = new Set(rejected.map((r) => r.index));
          rejected.forEach(({ index, message }) => {
            if (batch[index]) skipped.push({ row: batch[index], reason: message });
          });
          batch = batch.filter((_, index) => !bad.has(index));
          if (batch.length > 0) await api.users.bulkCreate(batch.map(newStudentPayload));
        }
        added += batch.length;
      }
    } catch (error) {
      error.added = added; // lets the page say how many made it before the problem
      throw error;
    } finally {
      if (added > 0) {
        onProgress?.({ added, total, batch: batches, batches, stage: "refreshing" });
        await refresh();
      }
    }

    return { added, skipped };
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
        deleteAllStudents,
        importStudents,
        provisionAccount,
        regenerateTempPassword,
        issueTempPassword,
        dismissRequest,
        resetRequests,
        provisionAccounts,
        setRole,
        refreshStudents: refresh,
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
