import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { FiCamera, FiCheck, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { db } from "@oasis/shared/firebaseClient.js";
import StudentIdCard from "@oasis/shared/components/StudentIdCard.jsx";
import { usePoints } from "../context/PointsContext";
import { useStudent } from "../context/StudentContext";
import { fileToPhoto } from "../utils/image";

const fieldClass =
  "w-full rounded-md border border-[#cfcfcf] bg-white px-3 py-2 text-[12px] text-[#2b2b2b] placeholder-[#9a9a9a] outline-none focus:border-[#7a1317]";
const labelClass = "mb-1 block font-display text-[9px] uppercase tracking-[2px] text-[#7a1317]";

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
    const unsubscribe = onSnapshot(collection(db, "hobbiesCatalog"), (snapshot) => {
      setHobbiesCatalog(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
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

  const smallButton =
    "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[10px] font-bold uppercase tracking-[1.5px] transition-all disabled:opacity-50";

  const titleAction = editing ? (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => setEditing(false)}
        className={`${smallButton} border-[#cfcfcf] text-[#555] hover:bg-[#f0f0f0]`}
      >
        <FiX size={13} /> Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={`${smallButton} border-[#7a1317] bg-[#7a1317] text-white hover:bg-[#5e0f13]`}
      >
        <FiCheck size={13} /> {saving ? "Saving" : "Save"}
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={startEditing}
      className={`${smallButton} shrink-0 border-[#7a1317] text-[#7a1317] hover:bg-[#7a1317] hover:text-white`}
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
        <FiCamera size={13} /> {draft.photo ? "Change" : "Add photo"}
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
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[1px] transition-all ${
                  selected
                    ? "border-[#7a1317] bg-[#7a1317] text-white"
                    : "border-[#cfcfcf] bg-white text-[#555] hover:border-[#7a1317]"
                }`}
              >
                {h.label}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-[11px] font-semibold text-red-700">{error}</p>}
      <p className="text-[10px] italic text-[#888]">
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
