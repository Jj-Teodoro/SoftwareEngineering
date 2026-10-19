import { useEffect, useMemo, useRef, useState } from "react";
import { FiFilter, FiKey, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { useConfirm } from "@oasis/shared/components/ConfirmDialog.jsx";
import { EmptyState, PageHeader } from "@oasis/shared/components/ui.jsx";
import { useStudents } from "../context/StudentsContext";
import { usePoints } from "../context/PointsContext";
import { formatAgo, usePresence } from "../context/PresenceContext";
import AddStudentModal from "../components/AddStudentModal";
import StudentIdCardModal from "../components/StudentIdCardModal";
import ProvisionAccountsModal from "../components/ProvisionAccountsModal";
import StudentAvatar from "../components/StudentAvatar";

const PAGE_SIZE = 8;

// One grid for header and rows: a card on phones, a table row from md up.
const ROW =
  "grid grid-cols-2 items-center gap-x-4 gap-y-2.5 px-4 py-3 md:grid-cols-[minmax(0,2.6fr)_78px_minmax(0,1.3fr)_128px_minmax(0,1.2fr)]";

const FIXED_GROUPS = [
  { key: "status", label: "Status", options: ["ACTIVE", "INACTIVE"] },
  { key: "account", label: "Account", options: ["NO ACCOUNT", "PENDING", "ACTIVE", "RESET REQUESTED"] },
  { key: "clearance", label: "Clearance", options: ["CLEARED", "NOT CLEARED"] },
];
const NO_FILTERS = { status: "ALL", account: "ALL", clearance: "ALL", program: "ALL", year: "ALL", section: "ALL" };
const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort();

// Literal class names so Tailwind can see them.
const CHIP = { green: "chip-green", amber: "chip-amber", red: "chip-red", gray: "chip-gray", cyan: "chip-cyan" };

function Chip({ tone, pulse = false, children }) {
  return (
    <span className={CHIP[tone]}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {children}
    </span>
  );
}

// Active while the student is on the website or scanned in at an event.
function StatusCell({ student }) {
  const { getActivity, now } = usePresence();
  const a = getActivity(student.studentId);

  let detail;
  if (a.active) {
    detail = [a.online && "Online now", a.atEvent && `At ${a.eventTitle || "an event"}`].filter(Boolean).join(" · ");
  } else if (!student.authUid) {
    detail = "No account";
  } else {
    detail = a.lastSeen ? `Last seen ${formatAgo(a.lastSeen, now)}` : "Never logged in";
  }

  return (
    <div className="min-w-0">
      <Chip tone={a.active ? "green" : "red"} pulse={a.online}>
        {a.active ? "Active" : "Inactive"}
      </Chip>
      <p className="mt-1 truncate text-[11px] text-white/45" title={detail}>{detail}</p>
    </div>
  );
}

function AccountCell({ student, requested }) {
  if (!student.authUid) return <Chip tone="gray">No account</Chip>;
  if (requested) return <Chip tone="amber" pulse>Reset requested</Chip>;
  return student.mustChangePassword ? <Chip tone="amber">Pending</Chip> : <Chip tone="green">Active</Chip>;
}

function FilterPanel({ groups, filters, setFilters, activeCount }) {
  return (
    <div className="surface-accent absolute left-0 right-0 top-12 z-20 max-h-[70vh] overflow-y-auto bg-ink-panel p-4 shadow-2xl sm:right-auto sm:w-[380px]">
      {groups.map((group) => (
        <div key={group.key} className="mb-4">
          <p className="label mb-2">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {["ALL", ...group.options].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, [group.key]: option }))}
                className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  filters[group.key] === option
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-white/15 text-white/65 hover:bg-white/10"
                }`}
              >
                {option === "ALL" ? "All" : option}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setFilters(NO_FILTERS)} disabled={!activeCount} className="btn-ghost w-full">
        Reset filters
      </button>
    </div>
  );
}

export default function UserPage() {
  const { students, deleteStudents, resetRequests } = useStudents();
  const confirm = useConfirm();
  const { getTotalPoints, getClearance } = usePoints();
  const { getActivity } = usePresence();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const accountOf = (s) =>
    !s.authUid ? "NO ACCOUNT" : resetRequests[s.studentId] ? "RESET REQUESTED" : s.mustChangePassword ? "PENDING" : "ACTIVE";

  const groups = useMemo(
    () => [
      ...FIXED_GROUPS,
      { key: "program", label: "Program", options: uniqueSorted(students.map((s) => s.course)) },
      { key: "year", label: "Year level", options: uniqueSorted(students.map((s) => s.yearLevel)) },
      { key: "section", label: "Section", options: uniqueSorted(students.map((s) => s.section)) },
    ],
    [students]
  );
  const activeFilters = groups.filter((g) => filters[g.key] !== "ALL");

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((s) => {
      if (query && !s.studentId.toLowerCase().includes(query) && !s.name.toLowerCase().includes(query)) return false;
      const values = {
        status: getActivity(s.studentId).active ? "ACTIVE" : "INACTIVE",
        account: accountOf(s),
        clearance: getClearance(s.studentId).cleared ? "CLEARED" : "NOT CLEARED",
        program: s.course,
        year: s.yearLevel,
        section: s.section,
      };
      return Object.entries(filters).every(([key, wanted]) => wanted === "ALL" || values[key] === wanted);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, search, filters, getActivity, getClearance, resetRequests]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  useEffect(() => setPage(1), [search, filters]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };
  const toggleSelected = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleDeleteSelected = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    const confirmed = await confirm({
      title: "Delete students",
      message: `Delete ${count} selected student${count === 1 ? "" : "s"}? Their records, attendance and requirement progress are removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    await deleteStudents([...selectedIds]);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Students" subtitle={`${students.length} on the roster`}>
        {selectMode && selectedIds.size > 0 && (
          <button type="button" onClick={handleDeleteSelected} className="btn-danger">
            <FiTrash2 size={14} /> Delete ({selectedIds.size})
          </button>
        )}
        <button type="button" onClick={() => setShowProvisionModal(true)} className="btn-ghost">
          <FiKey size={14} /> Accounts
        </button>
        <button type="button" onClick={toggleSelectMode} className="btn-ghost">
          {selectMode ? "Cancel" : "Select"}
        </button>
        <button type="button" onClick={() => setShowAddModal(true)} className="btn-primary">
          <FiPlus size={14} /> Add
        </button>
      </PageHeader>

      <div className="relative flex flex-wrap items-center gap-2" ref={filterRef}>
        <div className="relative min-w-[200px] flex-1 sm:max-w-md">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student ID or name"
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={() => setFilterOpen((o) => !o)} className="btn-ghost">
          <FiFilter size={14} /> Filter
          {activeFilters.length > 0 && <span className="chip-cyan px-1.5">{activeFilters.length}</span>}
        </button>
        {filterOpen && (
          <FilterPanel groups={groups} filters={filters} setFilters={setFilters} activeCount={activeFilters.length} />
        )}
      </div>

      {(activeFilters.length > 0 || search.trim()) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs muted">Showing {filteredStudents.length} of {students.length}</span>
          {activeFilters.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, [g.key]: "ALL" }))}
              className="chip-gray hover:bg-white/10"
              title={`Remove ${g.label} filter`}
            >
              {g.label}: {filters[g.key]} <FiX size={11} />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button type="button" onClick={() => setFilters(NO_FILTERS)} className="label underline underline-offset-4 hover:text-white">
              Clear all
            </button>
          )}
        </div>
      )}

      <div className="surface overflow-hidden">
        <div className={`${ROW} hidden border-b border-white/10 bg-white/[0.03] md:grid`}>
          {["Student", "Section", "Status", "Account", "Points"].map((h) => (
            <span key={h} className="label">{h}</span>
          ))}
        </div>

        {pageStudents.length === 0 && <EmptyState>No students found.</EmptyState>}

        {pageStudents.map((user) => {
          const isSelected = selectedIds.has(user.studentId);
          const points = getTotalPoints(user.studentId);
          const { cleared, targetPoints } = getClearance(user.studentId);
          const pct = targetPoints > 0 ? Math.min(100, Math.round((points / targetPoints) * 100)) : 0;
          return (
            <div
              key={user.studentId}
              onClick={() => (selectMode ? toggleSelected(user.studentId) : setViewingStudentId(user.studentId))}
              className={`${ROW} cursor-pointer border-b border-white/10 transition-colors last:border-0 ${
                isSelected ? "bg-maroon/25" : "hover:bg-white/[0.04]"
              }`}
            >
              <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(user.studentId)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[#f2b400]"
                  />
                )}
                <StudentAvatar student={user} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={user.name}>{user.name}</p>
                  <p className="font-mono text-xs text-white/45">{user.studentId}</p>
                </div>
              </div>
              <span className="text-sm muted">{user.section}</span>
              <StatusCell student={user} />
              <AccountCell student={user} requested={Boolean(resetRequests[user.studentId])} />
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${cleared ? "bg-green-400" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 text-right font-mono text-xs text-white/75">{points}/{targetPoints}</span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`btn-sm min-w-8 ${page === n ? "btn-primary" : "btn-ghost"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {showAddModal && <AddStudentModal onClose={() => setShowAddModal(false)} />}
      {showProvisionModal && <ProvisionAccountsModal onClose={() => setShowProvisionModal(false)} />}
      {viewingStudentId && (
        <StudentIdCardModal studentId={viewingStudentId} onClose={() => setViewingStudentId(null)} />
      )}
    </div>
  );
}
