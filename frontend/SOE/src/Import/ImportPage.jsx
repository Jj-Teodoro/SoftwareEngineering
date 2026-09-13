import { useMemo, useRef, useState } from "react";
import { FiDownload, FiUploadCloud } from "react-icons/fi";
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

  const handleImport = () => {
    const validRows = preview.filter((r) => r.validity === "new");
    const outcome = importStudents(validRows);
    setResult(outcome);
    setRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">
          Import Students
        </h2>
        <button
          type="button"
          onClick={downloadImportTemplate}
          className="flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
        >
          <FiDownload size={16} />
          Download Template
        </button>
      </div>

      <div className="rounded-[24px] border border-white/20 bg-white/10 p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <FiUploadCloud size={36} className="mx-auto text-white/60" />
        <p className="mt-3 text-sm text-white/70">
          Upload an Excel (.xlsx) or CSV file with your students. Download the template above
          if you're not sure of the format.
        </p>
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#97191d] px-8 py-3 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25]">
          {isParsing ? "Reading file..." : "Choose File"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {fileName && <p className="mt-3 text-xs text-white/50">Selected: {fileName}</p>}
        {parseError && (
          <p className="mt-3 text-sm font-semibold text-red-300">{parseError}</p>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-green-400/40 bg-green-500/15 px-5 py-4 text-sm text-green-200">
          <p className="font-bold uppercase tracking-[1px]">Import complete</p>
          <p className="mt-1">
            Added {result.added} student{result.added === 1 ? "" : "s"}.
            {result.skipped.length > 0 &&
              ` Skipped ${result.skipped.length} row${
                result.skipped.length === 1 ? "" : "s"
              } (missing info or already existing).`}
          </p>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white/80">
              {validCount} of {preview.length} rows ready to import
            </p>
            <button
              type="button"
              onClick={handleImport}
              disabled={validCount === 0}
              className="h-11 rounded-full bg-[#97191d] px-8 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Import {validCount} Student{validCount === 1 ? "" : "s"}
            </button>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#7a1317]/70">
                    {["Student ID", "Name", "Course", "Section", "Status"].map((col) => (
                      <th
                        key={col}
                        className="sticky top-0 bg-[#7a1317] px-6 py-3 text-sm font-bold uppercase tracking-[2px] text-white"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr
                      key={`${row.studentId}-${i}`}
                      className={`border-b border-dashed border-white/20 last:border-none ${
                        row.validity === "new"
                          ? i % 2 === 0
                            ? "bg-white/10"
                            : "bg-white/5"
                          : row.validity === "duplicate"
                          ? "bg-yellow-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      <td className="px-6 py-3 text-sm font-semibold text-white">
                        {row.studentId || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-white/90">{row.name || "—"}</td>
                      <td className="px-6 py-3 text-sm text-white/90">{row.course || "—"}</td>
                      <td className="px-6 py-3 text-sm text-white/90">{row.section || "—"}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[1px] ${
                            row.validity === "new"
                              ? "bg-green-500/20 text-green-300"
                              : row.validity === "duplicate"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {row.validity === "new"
                            ? "New"
                            : row.validity === "duplicate"
                            ? "Duplicate"
                            : "Missing Info"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
