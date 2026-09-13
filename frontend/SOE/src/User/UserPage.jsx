import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiFilter, FiTrash2 } from "react-icons/fi";
import { useStudents } from "../context/StudentsContext";
import AddStudentModal from "../components/AddStudentModal";
import StudentIdCardModal from "../components/StudentIdCardModal";

const PAGE_SIZE = 6;
const FILTER_OPTIONS = ["ALL", "ACTIVE", "INACTIVE"];

export default function UserPage() {
  const { students, deleteStudents } = useStudents();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);

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
      const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [students, search, statusFilter]);

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

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.size} selected account(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    deleteStudents([...selectedIds]);
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
      <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-[#7a1317]/70">
                {selectMode && <th className="w-12 px-4 py-4" />}
                {["Student ID", "Name", "Section", "Status"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-4 text-sm font-bold uppercase tracking-[2px] text-white"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={selectMode ? 5 : 4}
                    className="px-6 py-10 text-center text-sm text-white/60"
                  >
                    No students found.
                  </td>
                </tr>
              )}
              {pageStudents.map((user, i) => {
                const isSelected = selectedIds.has(user.studentId);
                return (
                  <tr
                    key={user.studentId}
                    className={`border-b border-dashed border-white/20 last:border-none ${
                      isSelected
                        ? "bg-[#97191d]/30"
                        : i % 2 === 0
                        ? "bg-white/10"
                        : "bg-white/5"
                    }`}
                  >
                    {selectMode && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(user.studentId)}
                          className="h-4 w-4 cursor-pointer accent-[#97191d]"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {user.studentId}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/90">
                      <button
                        type="button"
                        onClick={() => setViewingStudent(user)}
                        className="text-left underline-offset-4 hover:text-white hover:underline"
                      >
                        {user.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/90">{user.section}</td>
                    <td className="px-6 py-4 text-sm text-white/90">{user.status}</td>
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
      {viewingStudent && (
        <StudentIdCardModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
        />
      )}
    </div>
  );
}
