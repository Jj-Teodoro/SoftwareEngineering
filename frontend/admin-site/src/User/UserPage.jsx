import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiFilter, FiTrash2, FiKey } from "react-icons/fi";
import { useStudents } from "../context/StudentsContext";
import { usePoints } from "../context/PointsContext";
import { formatAgo, usePresence } from "../context/PresenceContext";
import AddStudentModal from "../components/AddStudentModal";
import StudentIdCardModal from "../components/StudentIdCardModal";
import ProvisionAccountsModal from "../components/ProvisionAccountsModal";
import StudentAvatar from "../components/StudentAvatar";

const PAGE_SIZE = 6;
const FILTER_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"];

const PILL_TONES = {
  green: "bg-green-500/15 text-green-300 ring-green-400/30",
  amber: "bg-yellow-500/15 text-yellow-300 ring-yellow-400/30",
  gray: "bg-white/5 text-white/45 ring-white/15",
  red: "bg-red-500/15 text-red-300 ring-red-400/30",
};

function Pill({ tone, pulse = false, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] ring-1 ${PILL_TONES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {children}
    </span>
  );
}

// Active while the student is using the website or is scanned in at an event;
// Inactive once they leave the site and scan out.
function StatusBadge({ student }) {
  const { getActivity, now } = usePresence();
  const a = getActivity(student.studentId);

  let detail;
  if (a.active) {
    detail = [a.online && "Online now", a.atEvent && `At ${a.eventTitle || "an event"}`]
      .filter(Boolean)
      .join(" · ");
  } else if (!student.authUid) {
    detail = "No account";
  } else {
    detail = a.lastSeen ? `Last seen ${formatAgo(a.lastSeen, now)}` : "Never logged in";
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Pill tone={a.active ? "green" : "red"} pulse={a.online}>
        {a.active ? "Active" : "Inactive"}
      </Pill>
      <span className="max-w-[160px] truncate text-[10px] text-white/45" title={detail}>
        {detail}
      </span>
    </div>
  );
}

function AccountBadge({ student }) {
  const { resetRequests } = useStudents();
  if (!student.authUid) return <Pill tone="gray">No account</Pill>;
  if (resetRequests[student.studentId]) {
    return (
      <Pill tone="amber" pulse>
        Reset requested
      </Pill>
    );
  }
  return student.mustChangePassword ? (
    <Pill tone="amber">Pending</Pill>
  ) : (
    <Pill tone="green">Active</Pill>
  );
}

const COLUMNS = [
  { label: "Student", className: "" },
  { label: "Section", className: "w-[120px]" },
  { label: "Status", className: "w-[190px]" },
  { label: "Account", className: "w-[150px]" },
  { label: "Points", className: "w-[210px]" },
];

export default function UserPage() {
  const { students, deleteStudents } = useStudents();
  const { getTotalPoints, getClearance, targetPoints } = usePoints();
  const { getActivity } = usePresence();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [viewingStudentId, setViewingStudentId] = useState(null);

  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !query ||
        s.studentId.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query);
      const live = getActivity(s.studentId).active ? "ACTIVE" : "INACTIVE";
      const matchesStatus = statusFilter === "ALL" || live === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [students, search, statusFilter, getActivity]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageStudents = filteredStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelected = (studentId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} selected account(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    await deleteStudents([...selectedIds]);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Search + Filter row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-4">
          <div className="flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-white/30 bg-white/10 px-5 backdrop-blur-md">
            <FiSearch className="text-white/70" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student ID or name"
              className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              className="flex h-12 items-center gap-2 rounded-full bg-white/90 px-8 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
            >
              <FiFilter size={16} />
              {statusFilter === "ALL" ? "Filter" : statusFilter}
            </button>

            {filterOpen && (
              <div className="absolute left-0 top-14 z-20 w-40 overflow-hidden rounded-2xl border border-white/20 bg-[#2a0507] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option);
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-[1px] transition-colors ${
                      statusFilter === option
                        ? "bg-[#97191d] text-white"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectMode && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-red-700"
            >
              <FiTrash2 size={16} />
              Delete ({selectedIds.size})
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            className="flex h-12 items-center gap-2 rounded-full border border-white/40 bg-white/5 px-6 text-sm font-bold uppercase tracking-[2px] text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            <FiKey size={16} />
            Accounts
          </button>
          <button
            type="button"
            onClick={toggleSelectMode}
            className={`h-12 rounded-full border px-8 text-sm font-bold uppercase tracking-[2px] backdrop-blur-md transition-all ${
              selectMode
                ? "border-white/60 bg-white/20 text-white"
                : "border-white/40 bg-white/5 text-white hover:bg-white/15"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="h-12 rounded-full border border-white/40 bg-white/5 px-8 text-sm font-bold uppercase tracking-[2px] text-white backdrop-blur-md transition-all hover:bg-white/15"
          >
            Add
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[20px] border border-white/15 bg-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-gradient-to-r from-[#7a1317] to-[#5a0e12]">
                {selectMode && <th className="w-12 px-4 py-3.5" />}
                {COLUMNS.map((col) => (
                  <th
                    key={col.label}
                    className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[2px] text-white/90 ${col.className}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={selectMode ? 6 : 5}
                    className="px-6 py-12 text-center text-sm text-white/60"
                  >
                    No students found.
                  </td>
                </tr>
              )}
              {pageStudents.map((user) => {
                const isSelected = selectedIds.has(user.studentId);
                const points = getTotalPoints(user.studentId);
                const cleared = getClearance(user.studentId).cleared;
                const pct =
                  targetPoints > 0 ? Math.min(100, Math.round((points / targetPoints) * 100)) : 0;
                return (
                  <tr
                    key={user.studentId}
                    onClick={() =>
                      selectMode ? toggleSelected(user.studentId) : setViewingStudentId(user.studentId)
                    }
                    className={`group cursor-pointer border-b border-white/10 transition-colors last:border-none ${
                      isSelected ? "bg-[#97191d]/30" : "hover:bg-white/[0.08]"
                    }`}
                  >
                    {selectMode && (
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(user.studentId)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer accent-[#97191d]"
                        />
                      </td>
                    )}
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectMode) setViewingStudentId(user.studentId);
                        }}
                        className="flex items-center gap-3.5 text-left"
                      >
                        <StudentAvatar student={user} size={42} />
                        <span className="min-w-0">
                          <span
                            className="block max-w-[320px] truncate text-sm font-semibold text-white underline-offset-4 group-hover:underline"
                            title={user.name}
                          >
                            {user.name}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] tracking-[1px] text-white/50">
                            {user.studentId}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-sm text-white/80">
                      {user.section}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge student={user} />
                    </td>
                    <td className="px-5 py-3.5">
                      <AccountBadge student={user} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-black/40">
                          <div
                            className={`h-full rounded-full transition-all ${
                              cleared ? "bg-green-500" : "bg-[#c4262c]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs font-semibold tabular-nums text-white/80">
                          {points}/{targetPoints}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            className={`h-10 min-w-10 rounded-full border px-4 text-sm font-bold transition-all ${
              page === n
                ? "border-white/30 bg-[#97191d] text-white"
                : "border-white/40 bg-white/5 text-white backdrop-blur-md hover:bg-white/15"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} />}
      {showProvisionModal && (
        <ProvisionAccountsModal onClose={() => setShowProvisionModal(false)} />
      )}
      {viewingStudentId && (
        <StudentIdCardModal
          studentId={viewingStudentId}
          onClose={() => setViewingStudentId(null)}
        />
      )}
    </div>
  );
}
