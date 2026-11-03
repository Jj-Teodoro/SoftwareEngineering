import { useRef, useState } from "react";
import { FiCamera, FiCheck, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import StudentIdCard from "../../../components/common/StudentIdCard.jsx";
import { usePoints } from "../../../context/student/PointsContext";
import { useStudent } from "../../../context/student/StudentContext";
import { fileToPhoto } from "../../../utils/image";

export default function ActivityCard({ student, onShowBreakdown }) {
  const { totalPoints, targetPoints, cleared } = usePoints();
  const { updateProfile } = useStudent();
  const fileRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ photo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEditing = () => {
    setDraft({ photo: student.photo || "" });
    setError("");
    setEditing(true);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const photo = await fileToPhoto(file);
      setDraft((d) => ({ ...d, photo }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(draft);
      setEditing(false);
    } catch {
      setError("Could not save your changes. Please try again.");
    }
    setSaving(false);
  };

  const smallButton = "st-btn-sm";

  const titleAction = editing ? (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => setEditing(false)}
        className={`${smallButton} text-[var(--text-muted)] hover:border-[var(--gold)]`}
        style={{ borderColor: "var(--line)" }}
      >
        <FiX size={13} /> Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={`${smallButton} border-[var(--gold)] bg-[var(--gold)] text-[var(--on-gold)]`}
      >
        <FiCheck size={13} /> {saving ? "Saving" : "Save"}
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={startEditing}
      className={`${smallButton} shrink-0 border-[var(--gold)] text-[var(--accent-text)] hover:bg-[var(--gold)] hover:text-[var(--on-gold)]`}
    >
      <FiEdit2 size={13} /> Edit card
    </button>
  );

  const photoOverlay = editing ? (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/65 py-2 text-[10px] font-bold uppercase tracking-[1.5px] text-white hover:bg-black/80"
      >
        <FiCamera size={13} /> {draft.photo ? "Change" : "Add"}
      </button>
      {draft.photo && (
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, photo: "" }))}
          aria-label="Remove photo"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-red-700"
        >
          <FiTrash2 size={12} />
        </button>
      )}
    </>
  ) : null;

  return (
    <>
    <StudentIdCard
      student={editing ? { ...student, photo: draft.photo } : student}
      totalPoints={totalPoints}
      targetPoints={targetPoints}
      cleared={cleared}
      onShowBreakdown={onShowBreakdown}
      titleAction={titleAction}
      photoOverlay={photoOverlay}
    />
    {error && <p className="mt-3 text-sm font-medium text-[var(--danger)]">! {error}</p>}
    </>
  );
}
