import { useMemo, useState } from "react";
import { FiCopy, FiDownload, FiFileText } from "react-icons/fi";
import Modal from "../common/Modal.jsx";
import { useStudents } from "../../context/staff/StudentsContext";
import { downloadPasswordsXlsx } from "../../utils/accountsExport";


function toCsv(results) {
  const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const rows = [["Student Number", "Name", "Temporary Password"]];
  results
    .filter((r) => r.ok)
    .forEach((r) => rows.push([r.studentId, r.name, r.tempPassword]));
  return rows.map((row) => row.map(escape).join(",")).join("\r\n");
}

// `candidates` are the students the admin is looking at: the ones ticked in Select mode, or else
// everyone matching the current filters. `scopeLabel` says which of the two it is.
export default function ProvisionAccountsModal({ onClose, candidates, scopeLabel = "on the roster" }) {
  const { students, provisionAccounts } = useStudents();
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  // students sign in with their student number, so everyone without an account is ready
  const pool = candidates ?? students;
  const ready = useMemo(() => pool.filter((s) => !s.authUid), [pool]);
  const alreadyHave = pool.length - ready.length;

  const handleCreate = async () => {
    setProgress({ done: 0, total: ready.length });
    const out = await provisionAccounts(
      ready.map((s) => s.studentId),
      (done, total) => setProgress({ done, total })
    );
    setResults(out);
    setProgress(null);
  };

  const downloadCsv = () => {
    const blob = new Blob([toCsv(results)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oasis-temporary-passwords.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXlsx = async () => {
    const rows = results
      .filter((r) => r.ok)
      .map((r) => {
        const student = students.find((s) => s.studentId === r.studentId) || {};
        return {
          studentId: r.studentId,
          name: r.name,
          course: student.course,
          yearLevel: student.yearLevel,
          section: student.section,
          tempPassword: r.tempPassword,
        };
      });
    await downloadPasswordsXlsx(rows);
  };

  const copyAll = async () => {
    const text = results
      .filter((r) => r.ok)
      .map((r) => `${r.studentId}\t${r.tempPassword}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; use the CSV download instead
    }
  };

  const created = results?.filter((r) => r.ok).length ?? 0;
  const failed = results?.filter((r) => !r.ok) ?? [];

  return (
    <Modal onClose={onClose} maxWidth="max-w-3xl">
      <h2 className="page-title pr-8 mb-2">
        Create Student Accounts
      </h2>

      {!results ? (
        <>
          <p className="text-sm text-white/70">
            Each student gets a login using their student number and a random temporary
            password. They'll be asked to choose their own password the first time they log in.
          </p>
          <div className="surface-inset p-4 mt-4 space-y-1">
            <p>
              <span className="font-bold">{ready.length}</span> student(s) ready for an account
            </p>
            <p className="text-xs text-white/60">
              Out of {pool.length} student(s) {scopeLabel}
              {alreadyHave > 0 && `, ${alreadyHave} already have one`}. To pick other students, close this
              window and change the filters or tick students in Select mode.
            </p>
          </div>
          <p className="mt-3 text-xs text-gold">
            The full list of temporary passwords is shown once, right after creation, so download the
            Excel file before closing this window. A single student's password can still be seen in their
            Account tab until they choose their own.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={ready.length === 0 || Boolean(progress)}
              className="btn-primary"
            >
              {progress
                ? `Creating ${progress.done}/${progress.total}...`
                : `Create ${ready.length} account(s)`}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-white/80">
            Created <span className="font-bold text-green-300">{created}</span> account(s)
            {failed.length > 0 && (
              <>
                , <span className="font-bold text-red-300">{failed.length}</span> failed
              </>
            )}
            . Save these passwords now — they won't be shown again.
          </p>
          <div className="surface-inset p-4 mt-4 max-h-[50vh] overflow-auto">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="bg-white/[0.04] font-mono uppercase tracking-wider text-white/60">
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Temporary password</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.studentId} className="border-t border-white/10">
                    <td className="px-3 py-2 font-semibold">{r.studentId}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="select-all font-mono text-sm font-bold tracking-[1px]">
                          {r.tempPassword}
                        </span>
                      ) : (
                        <span className="text-red-300">{r.message}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={copyAll}
              disabled={created === 0}
              className="btn-ghost"
            >
              <FiCopy size={13} /> {copied ? "Copied" : "Copy all"}
            </button>
            <button
              type="button"
              onClick={downloadXlsx}
              disabled={created === 0}
              className="btn-primary"
            >
              <FiFileText size={13} /> Download Excel
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={created === 0}
              className="btn-ghost"
            >
              <FiDownload size={13} /> Download CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Done
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
