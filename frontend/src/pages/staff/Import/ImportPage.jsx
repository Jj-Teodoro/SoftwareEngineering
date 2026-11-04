import { useMemo, useRef, useState } from "react";
import { FiDownload, FiLoader, FiUploadCloud, FiUsers } from "react-icons/fi";
import { PageHeader, Section } from "../../../components/common/ui.jsx";
import { useStudents } from "../../../context/staff/StudentsContext";
import {
  parseStudentsFile,
  normalizeImportRow,
  downloadImportTemplate,
} from "../../../utils/studentImport";

// Full-page overlay while an import runs: a progress ring, a bar, and what is happening now.
// It also stops the Import button from being pressed twice.
function ImportProgress({ progress }) {
  const { added, total, batch, batches, stage } = progress;
  const pct = total > 0 ? Math.round((added / total) * 100) : 0;
  const shown = stage === "refreshing" ? 100 : pct;
  const ring = 2 * Math.PI * 52;
  const step =
    stage === "refreshing"
      ? "Updating the student list..."
      : batches > 1
      ? `Sending batch ${batch} of ${batches}...`
      : "Saving the students...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="surface-accent w-full max-w-sm p-6 text-center shadow-2xl sm:p-8">
        <div className="relative mx-auto h-32 w-32">
          {/* a faint spinning dashed ring behind the progress ring, so it never looks frozen */}
          <svg className="absolute inset-0 h-full w-full animate-spin [animation-duration:3s]" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="58" fill="none" stroke="rgba(5,217,232,0.35)" strokeWidth="1.5" strokeDasharray="4 10" />
          </svg>
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#f2b400"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - shown / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold leading-none">{shown}%</span>
            <FiUsers size={14} className="mt-1.5 text-gold/80" />
          </div>
        </div>

        <h2 className="page-title mt-5">Importing students</h2>
        <p className="mt-2 font-mono text-sm">
          <span className="text-gold">{added}</span>
          <span className="muted"> of {total} added</span>
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-gold to-[#ffc933] transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(shown, 4)}%` }}
          >
            <span className="absolute inset-0 animate-pulse bg-white/25" />
          </div>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/80">
          <FiLoader size={14} className="animate-spin text-neon-cyan" /> {step}
        </p>
        <p className="mt-2 text-xs muted">Keep this page open until it finishes.</p>
      </div>
    </div>
  );
}

export default function ImportPage() {
  const { students, importStudents } = useStudents();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null); // set while an import is running
  const fileInputRef = useRef(null);

  const existingIds = useMemo(
    () => new Set(students.map((s) => s.studentId.toLowerCase())),
    [students]
  );

  const preview = useMemo(() => {
    const seen = new Set();
    return rows.map((row) => {
      const idLower = row.studentId.toLowerCase();
      let validity = "new";
      if (!row.studentId || !row.name) validity = "invalid";
      else if (existingIds.has(idLower) || seen.has(idLower)) validity = "duplicate";
      if (validity === "new") seen.add(idLower);
      return { ...row, validity };
    });
  }, [rows, existingIds]);

  const validCount = preview.filter((r) => r.validity === "new").length;

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult(null);
    setIsParsing(true);
    try {
      const rawRows = await parseStudentsFile(file);
      const normalized = rawRows.map(normalizeImportRow);
      setRows(normalized);
      if (normalized.length === 0) {
        setParseError(
          "No rows could be read. Make sure the first row has headers like Student ID, Name, Course, Section, etc."
        );
      }
    } catch (err) {
      setParseError("Could not read this file. Please upload a valid .xlsx or .csv file.");
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    const validRows = preview.filter((r) => r.validity === "new");
    setParseError("");
    setProgress({ added: 0, total: validRows.length, batch: 1, batches: 1, stage: "sending" });
    let outcome;
    try {
      outcome = await importStudents(validRows, setProgress);
    } catch (error) {
      const done = error.added ? ` ${error.added} students were added before this; choose the file again to add the rest.` : "";
      setParseError(`${error.message || "The import did not finish."}${done}`);
      return;
    } finally {
      setProgress(null);
    }
    setResult(outcome);
    setRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const CHIP = { new: ["chip-green", "New"], duplicate: ["chip-amber", "Duplicate"], invalid: ["chip-red", "Missing info"] };

  return (
    <div className="flex flex-col gap-5">
      {progress && <ImportProgress progress={progress} />}
      <PageHeader title="Import students" subtitle="Add many students at once from a spreadsheet.">
        <button type="button" onClick={downloadImportTemplate} className="btn-ghost">
          <FiDownload size={14} /> Download template
        </button>
      </PageHeader>

      <Section>
        <div className="py-4 text-center">
          <FiUploadCloud size={34} className="mx-auto text-gold/80" />
          <p className="mx-auto mt-3 max-w-md text-sm muted">
            Upload an Excel (.xlsx) or CSV file. Not sure of the format? Download the template first.
          </p>
          <label className={`btn-primary mt-5 cursor-pointer px-6 ${isParsing ? "pointer-events-none opacity-80" : ""}`}>
            {isParsing ? (
              <>
                <FiLoader size={14} className="animate-spin" /> Reading file...
              </>
            ) : (
              "Choose file"
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {fileName && <p className="mt-3 font-mono text-xs text-white/50">Selected: {fileName}</p>}
          {parseError && <p className="mt-3 text-sm text-neon-pink">{parseError}</p>}
        </div>
      </Section>

      {result && (
        <div className="rounded-lg border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          <p className="label text-green-300">Import complete</p>
          <p className="mt-1">
            Added {result.added} student{result.added === 1 ? "" : "s"}.
            {result.skipped.length > 0 &&
              ` Skipped ${result.skipped.length} row${result.skipped.length === 1 ? "" : "s"}.`}
          </p>
          {result.skipped.length > 0 && (
            <div className="mt-3 rounded-md border border-yellow-400/25 bg-black/20 p-3 text-yellow-100">
              <p className="label text-yellow-300">Skipped rows — fix these in the file and import it again</p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-xs">
                {result.skipped.map(({ row, reason }, i) => (
                  <li key={`${row.studentId}-${i}`}>
                    <span className="text-white">{row.studentId || "(no ID)"}</span>
                    {row.name ? <span className="text-white/60"> · {row.name}</span> : null}
                    <span className="text-yellow-200/80"> — {reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/80">{validCount} of {preview.length} rows ready to import</p>
            <button type="button" onClick={handleImport} disabled={validCount === 0 || Boolean(progress)} className="btn-primary">
              Import {validCount} student{validCount === 1 ? "" : "s"}
            </button>
          </div>

          <div className="table-wrap">
            <div className="table-scroll max-h-[420px] overflow-y-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead className="sticky top-0 bg-[#1c1011]">
                  <tr>
                    {["Student ID", "Name", "Course", "Section", "Status"].map((col) => (
                      <th key={col} className="th">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {preview.map((row, i) => {
                    const [chip, label] = CHIP[row.validity];
                    return (
                      <tr key={`${row.studentId}-${i}`}>
                        <td className="td font-mono">{row.studentId || "—"}</td>
                        <td className="td">{row.name || "—"}</td>
                        <td className="td muted">{row.course || "—"}</td>
                        <td className="td muted">{row.section || "—"}</td>
                        <td className="td"><span className={chip}>{label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
