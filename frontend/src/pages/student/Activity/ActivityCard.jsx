import { useEffect, useRef, useState } from "react";
import { FiCamera, FiCheck, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { api } from "../../../api/client.js";
import StudentIdCard from "../../../components/common/StudentIdCard.jsx";
import { usePoints } from "../../../context/student/PointsContext";
import { useStudent } from "../../../context/student/StudentContext";
import { fileToPhoto } from "../../../utils/image";

const fieldClass =
  "w-full rounded-lg border bg-[var(--card-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--gold)]";
const labelClass = "st-label mb-1 block";

export default function ActivityCard({ student, onShowBreakdown }) {
  const { totalPoints, targetPoints, cleared } = usePoints();
  const { updateProfile } = useStudent();
  const fileRef = useRef(null);

  const [hobbiesCatalog, setHobbiesCatalog] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ bio: "", talent: "", hobbies: [], photo: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.hobbies
      .list()
      .then((list) => !cancelled && setHobbiesCatalog(list.map((h) => ({ id: h.hobby_id, label: h.label }))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const startEditing = () => {
    setDraft({
      bio: student.bio || "",
      talent: student.talent || "",
      hobbies: student.hobbies || [],
      photo: student.photo || "",
    });
    setError("");
    setEditing(true);
  };

  const toggleHobby = (label) =>
    setDraft((d) => ({
      ...d,
      hobbies: d.hobbies.includes(label)
        ? d.hobbies.filter((h) => h !== label)
        : [...d.hobbies, label],
    }));

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

  const aboutSlot = editing ? (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Bio</label>
        <textarea
          value={draft.bio}
          onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
          rows={3}
          maxLength={300}
          placeholder="Tell others a bit about yourself..."
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass}>Talent</label>
        <input
          value={draft.talent}
          onChange={(e) => setDraft((d) => ({ ...d, talent: e.target.value }))}
          maxLength={80}
          placeholder="e.g. Singing, Drawing, Coding"
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass}>Hobbies</label>
        <div className="flex flex-wrap gap-1.5">
          {hobbiesCatalog.map((h) => {
            const selected = draft.hobbies.includes(h.label);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHobby(h.label)}
                className={`st-chip border transition ${
                  selected
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--on-gold)]"
                    : "border-[var(--line)] bg-[var(--card-2)] text-[var(--text-muted)] hover:border-[var(--gold)]"
                }`}
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-sm font-medium text-[var(--danger)]">! {error}</p>}
      <p className="text-xs text-[var(--text-faint)]">
        Your name, student ID, program and points are managed by your admin.
      </p>
    </div>
  ) : undefined;

  return (
    <StudentIdCard
      student={editing ? { ...student, photo: draft.photo } : student}
      totalPoints={totalPoints}
      targetPoints={targetPoints}
      cleared={cleared}
      onShowBreakdown={onShowBreakdown}
      titleAction={titleAction}
      photoOverlay={photoOverlay}
      aboutSlot={aboutSlot}
    />
  );
}
