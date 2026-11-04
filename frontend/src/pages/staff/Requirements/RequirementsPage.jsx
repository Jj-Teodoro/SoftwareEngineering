import { useMemo, useState } from "react";
import { FiCheck, FiCheckCircle, FiEdit2, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { DirectionToggle, MiniSelect, sortBy } from "../../../components/common/SortControls.jsx";
import { useConfirm } from "../../../components/common/ConfirmDialog.jsx";
import Modal from "../../../components/common/Modal.jsx";
import { EmptyState, PageHeader, Section } from "../../../components/common/ui.jsx";
import StudentAvatar from "../../../components/staff/StudentAvatar";
import { useRequirements } from "../../../context/staff/RequirementsContext";
import { useStudents } from "../../../context/staff/StudentsContext";

// One grid for header and rows: a card on phones, a table row from md up.
const ROW =
  "grid grid-cols-2 items-center gap-x-4 gap-y-2.5 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_70px_minmax(0,1.3fr)_136px]";

function ProgramSelect({ value, onChange, programs, className = "input" }) {
  return (
    <select value={value} onChange={onChange} className={className}>
      <option value="ALL" className="text-black">All programs</option>
      {programs.map((p) => (
        <option key={p} value={p} className="text-black">{p}</option>
      ))}
    </select>
  );
}

const REQUIREMENT_SORTS = [
  { value: "title", label: "Name" },
  { value: "points", label: "Points" },
  { value: "completion", label: "Completion" },
  { value: "program", label: "Program" },
];
const STUDENT_SORTS = [
  { value: "name", label: "Name" },
  { value: "studentId", label: "Student ID" },
  { value: "section", label: "Section" },
];

// A search box for the compact filter toolbars on this page.
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-[160px] flex-1">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </div>
  );
}

const programLabel = (item) => (item.programFilter && item.programFilter !== "ALL" ? item.programFilter : "All programs");

export default function RequirementsPage() {
  const { items, addItem, updateItem, deleteItem, isCompleted, appliesTo } = useRequirements();
  const { students } = useStudents();
  const confirm = useConfirm();

  const programs = useMemo(
    () => [...new Set(students.map((s) => s.course).filter(Boolean))].sort(),
    [students]
  );

  const [title, setTitle] = useState("");
  const [points, setPoints] = useState("10");
  const [program, setProgram] = useState("ALL");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: "", pointValue: "", programFilter: "ALL" });
  const [editError, setEditError] = useState("");

  const [managingId, setManagingId] = useState(null);
  const managing = items.find((i) => i.id === managingId);

  // filters and sorting for the list
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("ANY");
  const [sortKey, setSortKey] = useState("title");
  const [sortDir, setSortDir] = useState("asc");

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    const result = await addItem({ title, pointValue: points, programFilter: program });
    setAdding(false);
    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    setTitle("");
    setPoints("10");
    setProgram("ALL");
    setAddError("");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      pointValue: String(item.pointValue),
      programFilter: item.programFilter || "ALL",
    });
    setEditError("");
  };

  const saveEdit = async () => {
    const result = await updateItem(editingId, draft);
    if (!result.ok) {
      setEditError(result.message);
      return;
    }
    setEditingId(null);
  };

  const handleDelete = async (item) => {
    const confirmed = await confirm({
      title: "Remove requirement",
      message: `Remove "${item.title}"? It disappears for every student, and anyone who completed it loses its ${item.pointValue} points.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (confirmed) await deleteItem(item.id);
  };

  const stats = (item) => {
    const eligible = students.filter((s) => appliesTo(item, s.course));
    const done = eligible.filter((s) => isCompleted(s.studentId, item.id)).length;
    return { eligible: eligible.length, done };
  };

  const shownItems = (() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q)) return false;
      if (programFilter === "ANY") return true;
      const forProgram = item.programFilter && item.programFilter !== "ALL" ? item.programFilter : "ALL";
      return forProgram === programFilter;
    });
    const valueOf = {
      title: (item) => item.title,
      points: (item) => Number(item.pointValue) || 0,
      completion: (item) => {
        const { eligible, done } = stats(item);
        return eligible > 0 ? done / eligible : 0;
      },
      program: (item) => programLabel(item),
    }[sortKey];
    return sortBy(list, valueOf, sortDir);
  })();
  const filtering = query.trim() || programFilter !== "ANY";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Requirements" subtitle="Items every student works toward, each worth points toward clearance.">
        <span className="chip-gray">{items.length} requirement{items.length === 1 ? "" : "s"}</span>
      </PageHeader>

      <Section title="Add a requirement">
        <form onSubmit={handleAdd}>
          <div className="grid gap-3 sm:grid-cols-[1fr_110px_220px_auto] sm:items-end">
            <div>
              <label className="label mb-1.5 block">Name</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setAddError("");
                }}
                placeholder="e.g. Organizational Shirt"
                className="input"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Points</label>
              <input type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label mb-1.5 block">For</label>
              <ProgramSelect value={program} onChange={(e) => setProgram(e.target.value)} programs={programs} />
            </div>
            <button type="submit" disabled={adding || !title.trim()} className="btn-primary">
              <FiPlus size={15} /> Add
            </button>
          </div>
          {addError && <p className="mt-2 text-sm text-neon-pink">{addError}</p>}
        </form>
      </Section>

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox value={query} onChange={setQuery} placeholder="Search requirements" />
          <MiniSelect
            label="Program"
            value={programFilter}
            onChange={setProgramFilter}
            options={[
              { value: "ANY", label: "Any program" },
              { value: "ALL", label: "For all programs" },
              ...programs.map((p) => ({ value: p, label: p })),
            ]}
          />
          <MiniSelect label="Sort requirements by" value={sortKey} onChange={setSortKey} options={REQUIREMENT_SORTS} />
          <DirectionToggle dir={sortDir} onChange={setSortDir} />
          {filtering && (
            <span className="text-xs muted">
              Showing {shownItems.length} of {items.length}
            </span>
          )}
        </div>
      )}

      <div className="surface overflow-hidden">
        <div className={`${ROW} hidden border-b border-white/10 bg-white/[0.03] md:grid`}>
          {["Requirement", "For", "Points", "Completed", ""].map((h, i) => (
            <span key={i} className="label">{h}</span>
          ))}
        </div>

        {items.length === 0 && <EmptyState>No requirements yet. Add one above.</EmptyState>}
        {items.length > 0 && shownItems.length === 0 && <EmptyState>No requirements match.</EmptyState>}

        {shownItems.map((item) => {
          const { eligible, done } = stats(item);
          const pct = eligible > 0 ? Math.round((done / eligible) * 100) : 0;
          const editing = editingId === item.id;
          return (
            <div key={item.id} className={`${ROW} border-b border-white/10 last:border-0`}>
              <div className="col-span-2 min-w-0 md:col-span-1">
                {editing ? (
                  <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="input" />
                ) : (
                  <span className="text-sm font-semibold">{item.title}</span>
                )}
              </div>
              <div>
                {editing ? (
                  <ProgramSelect
                    value={draft.programFilter}
                    onChange={(e) => setDraft((d) => ({ ...d, programFilter: e.target.value }))}
                    programs={programs}
                  />
                ) : (
                  <span className="label">{programLabel(item)}</span>
                )}
              </div>
              <div>
                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={draft.pointValue}
                    onChange={(e) => setDraft((d) => ({ ...d, pointValue: e.target.value }))}
                    className="input"
                  />
                ) : (
                  <span className="font-mono text-sm font-bold">{item.pointValue} pts</span>
                )}
              </div>
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-green-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-xs text-white/75">{done}/{eligible}</span>
              </div>
              <div className="col-span-2 flex flex-col items-end gap-1 md:col-span-1">
                {editing ? (
                  <>
                    <div className="flex gap-2">
                      <ActionButton label="Save" onClick={saveEdit} primary><FiCheck size={15} /></ActionButton>
                      <ActionButton label="Cancel" onClick={() => setEditingId(null)}><FiX size={15} /></ActionButton>
                    </div>
                    {editError && <span className="text-xs text-neon-pink">{editError}</span>}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <ActionButton label="Mark students" onClick={() => setManagingId(item.id)}><FiUsers size={15} /></ActionButton>
                    <ActionButton label="Edit" onClick={() => startEdit(item)}><FiEdit2 size={15} /></ActionButton>
                    <ActionButton label="Remove" danger onClick={() => handleDelete(item)}><FiTrash2 size={15} /></ActionButton>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {managing && <RequirementRosterModal item={managing} onClose={() => setManagingId(null)} />}
    </div>
  );
}

function ActionButton({ label, danger = false, primary = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`btn-icon ${primary ? "border-transparent bg-gold text-[#1a0405] hover:bg-gold-soft" : ""} ${
        danger ? "hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300" : ""
      }`}
    >
      {children}
    </button>
  );
}

function RequirementRosterModal({ item, onClose }) {
  const { isCompleted, toggleCompleted, appliesTo } = useRequirements();
  const { students } = useStudents();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("ALL"); // ALL | DONE | NOT_DONE
  const [section, setSection] = useState("ALL");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const eligible = students.filter((s) => appliesTo(item, s.course));
  const done = eligible.filter((s) => isCompleted(s.studentId, item.id)).length;
  const sections = [...new Set(eligible.map((s) => s.section).filter(Boolean))].sort();
  const query = search.trim().toLowerCase();
  const matching = eligible.filter((s) => {
    if (query && !s.name.toLowerCase().includes(query) && !s.studentId.toLowerCase().includes(query)) return false;
    if (section !== "ALL" && s.section !== section) return false;
    if (state === "ALL") return true;
    return isCompleted(s.studentId, item.id) === (state === "DONE");
  });
  const valueOf = { name: (s) => s.name, studentId: (s) => s.studentId, section: (s) => s.section }[sortKey];
  const shown = sortBy(matching, valueOf, sortDir);

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <h2 className="page-title pr-8">{item.title}</h2>
      <p className="mt-1 font-mono text-xs muted">
        {done} of {eligible.length} completed · {item.pointValue} pts each · {programLabel(item)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Search student ID or name" />
        <MiniSelect
          label="Completion"
          value={state}
          onChange={setState}
          options={[
            { value: "ALL", label: "Everyone" },
            { value: "DONE", label: "Done" },
            { value: "NOT_DONE", label: "Not done" },
          ]}
        />
        <MiniSelect
          label="Section"
          value={section}
          onChange={setSection}
          options={[{ value: "ALL", label: "All sections" }, ...sections.map((x) => ({ value: x, label: x }))]}
        />
        <MiniSelect label="Sort students by" value={sortKey} onChange={setSortKey} options={STUDENT_SORTS} />
        <DirectionToggle dir={sortDir} onChange={setSortDir} />
      </div>
      <p className="mt-2 text-xs muted">Showing {shown.length} of {eligible.length}</p>

      <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {shown.length === 0 && <EmptyState>No students found.</EmptyState>}
        {shown.map((student) => {
          const completed = isCompleted(student.studentId, item.id);
          return (
            <button
              key={student.studentId}
              type="button"
              onClick={() => toggleCompleted(student.studentId, item.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                completed ? "border-green-400/40 bg-green-500/10" : "border-white/10 bg-black/20 hover:bg-white/5"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <StudentAvatar student={student} size={34} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{student.name}</span>
                  <span className="block font-mono text-[11px] text-white/50">{student.studentId} · {student.section}</span>
                </span>
              </span>
              <span className={`shrink-0 ${completed ? "chip-green" : "chip-gray"}`}>
                {completed && <FiCheckCircle size={11} />}
                {completed ? "Done" : "Mark"}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
