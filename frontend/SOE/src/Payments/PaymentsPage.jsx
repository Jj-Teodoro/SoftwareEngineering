import { useMemo, useState } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import { useStudents } from "../context/StudentsContext";
import { useRequirements } from "../context/RequirementsContext";
import { exportPaymentsToExcel } from "../utils/paymentsExport";
import PaymentsTable from "./PaymentsTable";

export default function PaymentsPage() {
  const { students } = useStudents();
  const { items, addItem, isPaid, getStatus } = useRequirements();

  const [newItem, setNewItem] = useState("");
  const [addError, setAddError] = useState("");

  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("ALL");
  const [section, setSection] = useState("ALL");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const programs = useMemo(
    () => [...new Set(students.map((s) => s.course))].sort(),
    [students]
  );
  const sections = useMemo(
    () => [...new Set(students.map((s) => s.section))].sort(),
    [students]
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !query ||
        s.studentId.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query);
      const matchesProgram = program === "ALL" || s.course === program;
      const matchesSection = section === "ALL" || s.section === section;
      const matchesPending = !pendingOnly || !getStatus(s.studentId).cleared;
      return matchesQuery && matchesProgram && matchesSection && matchesPending;
    });
  }, [students, search, program, section, pendingOnly, getStatus]);

  const handleAddItem = () => {
    const result = addItem(newItem);
    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    setNewItem("");
    setAddError("");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const labelParts = [];
      if (program !== "ALL") labelParts.push(program);
      if (section !== "ALL") labelParts.push(section);
      const label = labelParts.length > 0 ? labelParts.join("_") : "all_students";
      await exportPaymentsToExcel({
        students: filteredStudents,
        items,
        isPaid,
        getStatus,
        label,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Payments</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => {
              setNewItem(e.target.value);
              setAddError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddItem();
              }
            }}
            placeholder="New requirement (e.g. ID Lace)"
            className="h-11 w-56 rounded-full border border-white/30 bg-white/10 px-4 text-sm text-white placeholder-white/50 outline-none backdrop-blur-md"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="flex h-11 items-center gap-2 rounded-full bg-[#97191d] px-5 text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#b81f25]"
          >
            <FiPlus size={16} />
            Add
          </button>
        </div>
      </div>
      {addError && <p className="-mt-4 text-right text-xs font-semibold text-red-300">{addError}</p>}

      {/* Unpaid summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <div className="rounded-[20px] border border-white/20 bg-white/10 px-5 py-4 text-sm text-white/60 backdrop-blur-md sm:col-span-2 lg:col-span-3">
            No payment requirements yet. Add one above (e.g. "Organizational Shirt").
          </div>
        )}
        {items.map((item) => {
          const paidCount = students.filter((s) => isPaid(s.studentId, item)).length;
          const unpaidCount = students.length - paidCount;
          const pct = students.length > 0 ? Math.round((paidCount / students.length) * 100) : 0;
          return (
            <div
              key={item}
              className="rounded-[20px] border border-white/20 bg-white/10 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
              <p className="text-sm font-bold uppercase tracking-[1px] text-white">{item}</p>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-green-300">{paidCount} paid</span>
                <span className="text-red-300">{unpaidCount} not paid</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-[#97191d] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters + export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student ID or name"
            className="h-11 w-56 rounded-full border border-white/30 bg-white/10 px-4 text-sm text-white placeholder-white/50 outline-none backdrop-blur-md"
          />
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="h-11 rounded-full border border-white/30 bg-white/10 px-3 text-sm text-white backdrop-blur-md"
          >
            <option className="text-black" value="ALL">
              All Programs
            </option>
            {programs.map((p) => (
              <option key={p} className="text-black" value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="h-11 rounded-full border border-white/30 bg-white/10 px-3 text-sm text-white backdrop-blur-md"
          >
            <option className="text-black" value="ALL">
              All Sections
            </option>
            {sections.map((s) => (
              <option key={s} className="text-black" value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 text-xs font-bold uppercase tracking-[1px] text-white backdrop-blur-md">
            <input
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="accent-[#97191d]"
            />
            Pending only
          </label>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || filteredStudents.length === 0}
          className="flex h-11 items-center gap-2 rounded-full bg-white/90 px-6 text-sm font-bold uppercase tracking-[1px] text-[#7a1317] transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FiDownload size={16} />
          {isExporting ? "Exporting..." : `Export ${filteredStudents.length} to Excel`}
        </button>
      </div>

      <PaymentsTable students={filteredStudents} />
    </div>
  );
}
