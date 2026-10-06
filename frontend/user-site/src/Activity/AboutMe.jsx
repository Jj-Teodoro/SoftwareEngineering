import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";
import { db } from "@oasis/shared/firebaseClient.js";
import Panel from "../components/Panel";
import { useStudent } from "../context/StudentContext";

const inputClass =
  "w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--gold)]";
const labelClass =
  "mb-1 block text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-muted)]";

export default function AboutMe() {
  const { student, updateProfile } = useStudent();
  const [hobbiesCatalog, setHobbiesCatalog] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [talent, setTalent] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "hobbiesCatalog"), (snapshot) => {
      setHobbiesCatalog(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const startEditing = () => {
    setBio(student.bio || "");
    setTalent(student.talent || "");
    setHobbies(student.hobbies || []);
    setEditing(true);
  };

  const toggleHobby = (label) =>
    setHobbies((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ bio, hobbies, talent });
    setSaving(false);
    setEditing(false);
  };

  return (
    <Panel
      title="About Me"
      action={
        !editing && (
          <button
            type="button"
            onClick={startEditing}
            className="flex items-center gap-2 rounded-lg border border-[var(--gold)] px-4 py-2 text-[11px] font-bold uppercase tracking-[2px] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-strong)]"
          >
            <FiEdit2 size={13} /> Edit
          </button>
        )
      }
    >
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell others a bit about yourself..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Talent</label>
            <input
              value={talent}
              onChange={(e) => setTalent(e.target.value)}
              placeholder="e.g. Singing, Drawing, Coding"
              className={inputClass}
            />
          </div>
          <div>
            <label className={`${labelClass} mb-2`}>Hobbies</label>
            <div className="flex flex-wrap gap-2">
              {hobbiesCatalog.map((h) => {
                const selected = hobbies.includes(h.label);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHobby(h.label)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      selected
                        ? "border-[var(--gold)] bg-[var(--gold)] text-[#2b0a0c]"
                        : "border-[var(--surface-border)] bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-strong)]"
                    }`}
                  >
                    {h.label}
                  </button>
                );
              })}
              {hobbiesCatalog.length === 0 && (
                <p className="text-xs text-[var(--text-muted)]">No hobbies catalog yet.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex h-10 items-center gap-2 rounded-lg border border-[var(--surface-border)] px-5 text-xs font-bold uppercase tracking-[2px] text-[var(--text-primary)] hover:bg-[var(--surface-strong)]"
            >
              <FiX size={14} /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex h-10 items-center gap-2 rounded-lg bg-[var(--gold)] px-5 text-xs font-bold uppercase tracking-[2px] text-[#2b0a0c] transition-all hover:brightness-110 disabled:opacity-50"
            >
              <FiCheck size={14} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-[var(--text-primary)]">
          <p>
            <span className="font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
              Bio:{" "}
            </span>
            {student.bio || "—"}
          </p>
          <p>
            <span className="font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
              Talent:{" "}
            </span>
            {student.talent || "—"}
          </p>
          <div>
            <span className="font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
              Hobbies:{" "}
            </span>
            {student.hobbies?.length > 0 ? (
              <span className="inline-flex flex-wrap gap-2 align-middle">
                {student.hobbies.map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-1 text-xs"
                  >
                    {h}
                  </span>
                ))}
              </span>
            ) : (
              "—"
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
