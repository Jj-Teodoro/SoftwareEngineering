import { useEffect, useState } from "react";
import { FiAward, FiCheck } from "react-icons/fi";
import { Section } from "../../../components/common/ui.jsx";
import { usePoints } from "../../../context/staff/PointsContext";
import { useStudents } from "../../../context/staff/StudentsContext";

export default function PointsTab() {
  const { requiredPoints, saveRequiredPoints, getTotalPoints, getTargetPoints } = usePoints();
  const { students } = useStudents();

  const [mode, setMode] = useState(requiredPoints ? "fixed" : "auto");
  const [value, setValue] = useState(requiredPoints ? String(requiredPoints) : "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  // follow the saved value when it arrives from the server or changes elsewhere
  useEffect(() => {
    setMode(requiredPoints ? "fixed" : "auto");
    setValue(requiredPoints ? String(requiredPoints) : "");
  }, [requiredPoints]);

  const typed = Number(value);
  const validFixed = Number.isInteger(typed) && typed >= 1 && typed <= 100000;
  const changed = mode === "auto" ? Boolean(requiredPoints) : validFixed && typed !== requiredPoints;

  // what the choice on screen would mean for the students right now
  const preview = (() => {
    if (students.length === 0) return null;
    if (mode === "fixed" && !validFixed) return null;
    const cleared = students.filter((s) => {
      const target = mode === "fixed" ? typed : getTargetPoints(s.studentId);
      return target > 0 && getTotalPoints(s.studentId) >= target;
    }).length;
    const over = mode === "fixed" ? students.filter((s) => getTotalPoints(s.studentId) > typed).length : 0;
    return { cleared, over };
  })();

  const save = async (e) => {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      await saveRequiredPoints(mode === "auto" ? null : typed);
      setStatus({ ok: true, text: mode === "auto" ? "Now automatic." : `Students now need ${typed} points.` });
    } catch (error) {
      setStatus({ ok: false, text: error.message || "Could not save that." });
    }
    setBusy(false);
  };

  const option = (id, title, text) => (
    <label
      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
        mode === id ? "border-gold/60 bg-gold/10" : "border-white/10 hover:border-white/25"
      }`}
    >
      <input type="radio" name="clearance-mode" checked={mode === id} onChange={() => setMode(id)} className="mt-1 accent-[#f2b400]" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed muted">{text}</span>
        {id === "fixed" && mode === "fixed" && (
          <span className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="1"
              max="100000"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 85"
              aria-label="Points needed to be cleared"
              className="input w-32"
              autoFocus
            />
            <span className="text-sm muted">points</span>
          </span>
        )}
      </span>
    </label>
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Section title="Points needed for clearance">
        <form onSubmit={save} className="flex flex-col gap-3">
          {option(
            "fixed",
            "Set a number",
            "You choose how many points every student needs. You can change it any time, and it applies to everyone right away."
          )}
          {option(
            "auto",
            "Automatic",
            "Each student needs the total of every requirement and every event that applies to their program. It changes whenever you add or remove one."
          )}

          {status && <p className={`text-sm ${status.ok ? "text-green-300" : "text-neon-pink"}`}>{status.text}</p>}
          <button type="submit" disabled={busy || !changed} className="btn-primary">
            <FiCheck size={14} /> {busy ? "Saving..." : "Save"}
          </button>
        </form>
      </Section>

      <Section title="What this means">
        <div className="space-y-3 text-sm leading-relaxed muted">
          <p>
            Students earn points from <span className="text-white">requirements</span> you mark as done and{" "}
            <span className="text-white">events</span> they attend. They are cleared once their points reach the number
            needed.
          </p>
          <p className="flex gap-2">
            <FiAward className="mt-0.5 shrink-0 text-gold" />
            <span>
              Earning <span className="text-white">more than needed is fine</span>. A student with 95 points when 85 are
              needed is cleared, and the extra 10 are kept and shown as "extra".
            </span>
          </p>
        </div>
        {preview && (
          <div className="surface-inset mt-4 p-4">
            <p className="label">With this choice, right now</p>
            <p className="mt-1.5 font-mono text-2xl font-bold">
              {preview.cleared} <span className="text-base font-normal text-white/50">of {students.length} students cleared</span>
            </p>
            {mode === "fixed" && preview.over > 0 && (
              <p className="mt-1 text-xs muted">{preview.over} of them already have more than {typed} points.</p>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
