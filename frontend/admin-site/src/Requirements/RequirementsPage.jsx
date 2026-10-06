import { useMemo, useState } from "react";
import { FiCheck, FiCheckCircle, FiEdit2, FiPlus, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import Modal from "../components/Modal";
import StudentAvatar from "../components/StudentAvatar";
import { useRequirements } from "../context/RequirementsContext";
import { useStudents } from "../context/StudentsContext";

const inputClass =
  "h-11 w-full rounded-lg border border-white/25 bg-black/25 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/60";
const labelClass = "mb-1 block text-[11px] font-bold uppercase tracking-[1px] text-white/70";

function ProgramSelect({ value, onChange, programs, className = inputClass }) {
  return (
    <select value={value} onChange={onChange} className={className}>
      <option value="ALL" className="text-black">
        All Programs
      </option>
      {programs.map((p) => (
        <option key={p} value={p} className="text-black">
          {p}
        </option>
      ))}
    </select>
  );
}

export default function RequirementsPage() {
  const { items, addItem, updateItem, deleteItem, isCompleted, appliesTo } = useRequirements();
  const { students } = useStudents();

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
    const confirmed = window.confirm(
      `Remove "${item.title}"? It disappears for every student, and anyone who completed it loses its ${item.pointValue} points.`
    );
    if (confirmed) await deleteItem(item.id);
  };

  const stats = (item) => {
    const eligible = students.filter((s) => appliesTo(item, s.course));
    const done = eligible.filter((s) => isCompleted(s.studentId, item.id)).length;
    return { eligible: eligible.length, done };
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Requirements</h2>
          <p className="mt-1 text-xs text-white/55">
            Items every student works toward. Each one is worth points toward clearance.
          </p>
        </div>
        <p className="text-xs font-bold uppercase tracking-[1px] text-white/60">
          {items.length} requirement{items.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Add */}
      <form
        onSubmit={handleAdd}
        className="rounded-[20px] border border-white/15 bg-white/[0.06] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-white/80">
          Add a requirement
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_110px_220px_auto] sm:items-end">
          <div>
            <label className={labelClass}>Name</label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setAddError("");
              }}
              placeholder="e.g. Organizational Shirt"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Points</label>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>For</label>
            <ProgramSelect value={program} onChange={(e) => setProgram(e.target.value)} programs={programs} />
          </div>
          <button
            type="submit"
            disabled={adding || !title.trim()}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#97191d] px-6 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
          >
            <FiPlus size={15} /> Add
          </button>
        </div>
        {addError && <p className="mt-2 text-xs font-semibold text-red-300">{addError}</p>}
      </form>

      {/* List */}
      <div className="overflow-hidden rounded-[20px] border border-white/15 bg-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="bg-gradient-to-r from-[#7a1317] to-[#5a0e12]">
                {[
                  ["Requirement", ""],
                  ["For", "w-[200px]"],
                  ["Points", "w-[90px]"],
                  ["Completed", "w-[210px]"],
                  ["", "w-[150px]"],
                ].map(([label, cls], i) => (
                  <th
                    key={i}
                    className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[2px] text-white/90 ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-white/60">
                    No requirements yet. Add one above.
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const { eligible, done } = stats(item);
                const pct = eligible > 0 ? Math.round((done / eligible) * 100) : 0;
                const editing = editingId === item.id;
                return (
                  <tr key={item.id} className="border-b border-white/10 last:border-none">
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <input
                          value={draft.title}
                          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                          className={`${inputClass} h-10`}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white">{item.title}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <ProgramSelect
                          value={draft.programFilter}
                          onChange={(e) => setDraft((d) => ({ ...d, programFilter: e.target.value }))}
                          programs={programs}
                          className={`${inputClass} h-10`}
                        />
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-[1px] text-white/70">
                          {item.programFilter && item.programFilter !== "ALL"
                            ? item.programFilter
                            : "All Programs"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          value={draft.pointValue}
                          onChange={(e) => setDraft((d) => ({ ...d, pointValue: e.target.value }))}
                          className={`${inputClass} h-10`}
                        />
                      ) : (
                        <span className="text-sm font-bold tabular-nums text-white">
                          {item.pointValue}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-black/40">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-white/80">
                          {done}/{eligible}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {editing ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveEdit}
                              aria-label="Save"
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#97191d] text-white hover:bg-[#b81f25]"
                            >
                              <FiCheck size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              aria-label="Cancel"
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"
                            >
                              <FiX size={15} />
                            </button>
                          </div>
                          {editError && (
                            <span className="text-[10px] font-semibold text-red-300">{editError}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <ActionButton label="Mark students" onClick={() => setManagingId(item.id)}>
                            <FiUsers size={15} />
                          </ActionButton>
                          <ActionButton label="Edit" onClick={() => startEdit(item)}>
                            <FiEdit2 size={15} />
                          </ActionButton>
                          <ActionButton label="Remove" danger onClick={() => handleDelete(item)}>
                            <FiTrash2 size={15} />
                          </ActionButton>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {managing && (
        <RequirementRosterModal item={managing} onClose={() => setManagingId(null)} />
      )}
    </div>
  );
}

function ActionButton({ label, danger = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border text-white/70 transition-all ${
        danger
          ? "border-white/20 hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-300"
          : "border-white/20 hover:bg-white/10 hover:text-white"
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

  const eligible = students.filter((s) => appliesTo(item, s.course));
  const done = eligible.filter((s) => isCompleted(s.studentId, item.id)).length;

  const query = search.trim().toLowerCase();
  const shown = eligible.filter(
    (s) =>
      !query || s.name.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query)
  );

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">{item.title}</h2>
      <p className="mt-1 text-xs text-white/60">
        {done} of {eligible.length} completed · {item.pointValue} pts each ·{" "}
        {item.programFilter && item.programFilter !== "ALL" ? item.programFilter : "All Programs"}
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search student ID or name"
        className={`${inputClass} mt-4 rounded-full px-5`}
      />

      <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
        {shown.length === 0 && (
          <p className="py-8 text-center text-sm text-white/55">No students found.</p>
        )}
        {shown.map((student) => {
          const completed = isCompleted(student.studentId, item.id);
          return (
            <button
              key={student.studentId}
              type="button"
              onClick={() => toggleCompleted(student.studentId, item.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all ${
                completed
                  ? "border-green-400/40 bg-green-500/10"
                  : "border-white/15 bg-black/20 hover:bg-white/10"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <StudentAvatar student={student} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">
                    {student.name}
                  </span>
                  <span className="block font-mono text-[11px] tracking-[1px] text-white/50">
                    {student.studentId} · {student.section}
                  </span>
                </span>
              </span>
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[1px] ${
                  completed
                    ? "bg-green-500/20 text-green-300"
                    : "border border-white/25 text-white/60"
                }`}
              >
                {completed && <FiCheckCircle size={12} />}
                {completed ? "Completed" : "Mark complete"}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
