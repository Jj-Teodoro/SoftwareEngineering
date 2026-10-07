import { useMemo, useRef, useState } from "react";
import { FiDownload, FiUploadCloud } from "react-icons/fi";
import { PageHeader, Section } from "@oasis/shared/components/ui.jsx";
import { useStudents } from "../context/StudentsContext";
import {
  parseStudentsFile,
  normalizeImportRow,
  downloadImportTemplate,
} from "../utils/studentImport";

export default function ImportPage() {
  const { students, importStudents } = useStudents();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState(null);
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
    const outcome = await importStudents(validRows);
    setResult(outcome);
    setRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const CHIP = { new: ["chip-green", "New"], duplicate: ["chip-amber", "Duplicate"], invalid: ["chip-red", "Missing info"] };

  return (
    <div className="flex flex-col gap-5">
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
          <label className="btn-primary mt-5 cursor-pointer px-6">
            {isParsing ? "Reading file..." : "Choose file"}
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
              ` Skipped ${result.skipped.length} row${result.skipped.length === 1 ? "" : "s"} (missing info or already existing).`}
          </p>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/80">{validCount} of {preview.length} rows ready to import</p>
            <button type="button" onClick={handleImport} disabled={validCount === 0} className="btn-primary">
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
