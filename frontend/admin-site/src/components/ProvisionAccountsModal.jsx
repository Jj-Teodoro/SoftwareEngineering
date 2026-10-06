import { useMemo, useState } from "react";
import { FiCopy, FiDownload } from "react-icons/fi";
import Modal from "./Modal";
import { useStudents } from "../context/StudentsContext";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function toCsv(results) {
  const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const rows = [["Student ID", "Name", "Email", "Temporary Password"]];
  results
    .filter((r) => r.ok)
    .forEach((r) => rows.push([r.studentId, r.name, r.email, r.tempPassword]));
  return rows.map((row) => row.map(escape).join(",")).join("\r\n");
}

export default function ProvisionAccountsModal({ onClose }) {
  const { students, provisionAccounts } = useStudents();
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const { ready, missingEmail } = useMemo(() => {
    const withoutAccount = students.filter((s) => !s.authUid);
    return {
      ready: withoutAccount.filter((s) => EMAIL_PATTERN.test((s.email || "").trim())),
      missingEmail: withoutAccount.filter((s) => !EMAIL_PATTERN.test((s.email || "").trim())),
    };
  }, [students]);

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

  const copyAll = async () => {
    const text = results
      .filter((r) => r.ok)
      .map((r) => `${r.studentId}\t${r.email}\t${r.tempPassword}`)
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
      <h2 className="mb-2 text-lg font-bold uppercase tracking-[2px] text-white">
        Create Student Accounts
      </h2>

      {!results ? (
        <>
          <p className="text-sm text-white/70">
            Each student gets a login using the email on their record and a random temporary
            password. They'll be asked to choose their own password the first time they log in.
          </p>
          <div className="mt-4 space-y-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
            <p>
              <span className="font-bold">{ready.length}</span> student(s) ready for an account
            </p>
            {missingEmail.length > 0 && (
              <p className="text-white/60">
                {missingEmail.length} skipped — no valid email on file (add one under Info):{" "}
                {missingEmail.map((s) => s.studentId).join(", ")}
              </p>
            )}
          </div>
          <p className="mt-3 text-xs text-[#f2b400]">
            Temporary passwords are shown once, right after creation. Save or hand them out
            before closing this window — admins can't view them again.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/30 px-6 py-2.5 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={ready.length === 0 || Boolean(progress)}
              className="rounded-full bg-[#97191d] px-6 py-2.5 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-[#b81f25] disabled:opacity-50"
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
          <div className="mt-4 max-h-[50vh] overflow-auto rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-left text-xs text-white">
              <thead>
                <tr className="bg-[#7a1317]/70 uppercase tracking-[1px]">
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Temporary password</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.studentId} className="border-t border-white/10">
                    <td className="px-3 py-2 font-semibold">{r.studentId}</td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.ok ? r.email : "—"}</td>
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
              className="flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-white/10 disabled:opacity-50"
            >
              <FiCopy size={13} /> {copied ? "Copied" : "Copy all"}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              disabled={created === 0}
              className="flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-white/10 disabled:opacity-50"
            >
              <FiDownload size={13} /> Download CSV
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#97191d] px-6 py-2.5 text-xs font-bold uppercase tracking-[1px] text-white hover:bg-[#b81f25]"
            >
              Done
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
