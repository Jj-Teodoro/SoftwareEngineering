import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { FiAward, FiCheck, FiEdit2, FiUser, FiX } from "react-icons/fi";
import { db } from "@oasis/shared/firebaseClient.js";
import { useStudent } from "../context/StudentContext";
import { usePoints } from "../context/PointsContext";
import { useRequirements } from "../context/RequirementsContext";

export default function ActivityPage() {
  const { student, updateProfile } = useStudent();
  const { totalPoints, targetPoints, cleared, pct } = usePoints();
  const { items, isCompleted } = useRequirements();

  const [hobbiesCatalog, setHobbiesCatalog] = useState([]);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(student?.bio || "");
  const [talent, setTalent] = useState(student?.talent || "");
  const [hobbies, setHobbies] = useState(student?.hobbies || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "hobbiesCatalog"), (snapshot) => {
      setHobbiesCatalog(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const startEditing = () => {
    setBio(student?.bio || "");
    setTalent(student?.talent || "");
    setHobbies(student?.hobbies || []);
    setEditing(true);
  };

  const toggleHobby = (label) => {
    setHobbies((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ bio, hobbies, talent });
    setSaving(false);
    setEditing(false);
  };

  if (!student) return null;

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
        Activity
      </h2>

      {/* Profile card */}
      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#97191d]">
              <FiUser size={28} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold uppercase tracking-[1px] text-[var(--text-primary)]">
                {student.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{student.studentId}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {student.course} · {student.section}
              </p>
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="flex h-10 items-center gap-2 self-start rounded-full border border-[var(--surface-border)] bg-[var(--surface-2)] px-5 text-xs font-bold uppercase tracking-[2px] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-strong)]"
            >
              <FiEdit2 size={14} /> Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-6 space-y-4 border-t border-[var(--surface-border)] pt-5">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell others a bit about yourself..."
                className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[#97191d]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
                Talent
              </label>
              <input
                value={talent}
                onChange={(e) => setTalent(e.target.value)}
                placeholder="e.g. Singing, Drawing, Coding"
                className="w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[#97191d]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-muted)]">
                Hobbies
              </label>
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
                          ? "border-[#97191d] bg-[#97191d] text-white"
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
                className="flex h-10 items-center gap-2 rounded-full border border-[var(--surface-border)] px-5 text-xs font-bold uppercase tracking-[2px] text-[var(--text-primary)] transition-all hover:bg-[var(--surface-strong)]"
              >
                <FiX size={14} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-10 items-center gap-2 rounded-full bg-[#97191d] px-5 text-xs font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
              >
                <FiCheck size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3 border-t border-[var(--surface-border)] pt-5 text-sm text-[var(--text-primary)]">
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
      </div>

      {/* Points card */}
      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
            <FiAward size={16} /> Points
          </h3>
          {cleared && (
            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[1px] text-green-400">
              Cleared
            </span>
          )}
        </div>
        <div className="mb-1 flex items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
          <span>Total Points</span>
          <span>
            {totalPoints}/{targetPoints} pts
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className={`h-full rounded-full transition-all ${
              cleared ? "bg-green-500" : "bg-[#97191d]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[2px] text-[var(--text-primary)]">
          Requirements
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No requirements have been posted yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const done = isCompleted(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        done
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-[var(--surface-border)] text-transparent"
                      }`}
                    >
                      <FiCheck size={14} />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#97191d]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--text-primary)]">
                    <FiAward size={10} /> {item.pointValue} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
