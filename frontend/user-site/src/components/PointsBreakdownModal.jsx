import CyberModal from "./CyberModal";
import { useEvents } from "../context/EventsContext";
import { useRequirements } from "../context/RequirementsContext";
import { usePoints } from "../context/PointsContext";

function Row({ label, points }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[var(--surface-border)] py-2 text-sm">
      <span className="text-[var(--text-primary)]">{label}</span>
      <span className="shrink-0 font-mono font-bold text-[var(--gold)]">+{points} pts</span>
    </div>
  );
}

export default function PointsBreakdownModal({ onClose }) {
  const { items, isCompleted } = useRequirements();
  const { attended, myAttendance } = useEvents();
  const { totalPoints, targetPoints } = usePoints();

  const doneRequirements = items.filter((i) => isCompleted(i.id));

  return (
    <CyberModal onClose={onClose} maxWidth="max-w-md" tag="sys://points_log">
      <h2 className="cp-glitch mb-1 font-display text-lg uppercase tracking-[2px] text-[var(--panel-title)]">
        Points Breakdown
      </h2>
      <p className="mb-5 font-mono text-xs uppercase tracking-[1px] text-[var(--neon-cyan)]">
        &gt; {totalPoints} / {targetPoints} points earned
      </p>

      <h3 className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
        // Requirements
      </h3>
      {doneRequirements.length === 0 ? (
        <p className="mb-4 py-2 font-mono text-sm text-[var(--text-faint)]">None completed yet.</p>
      ) : (
        <div className="mb-4">
          {doneRequirements.map((r) => (
            <Row key={r.id} label={r.title} points={r.pointValue} />
          ))}
        </div>
      )}

      <h3 className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
        // Events attended
      </h3>
      {attended.length === 0 ? (
        <p className="py-2 font-mono text-sm text-[var(--text-faint)]">No events attended yet.</p>
      ) : (
        attended.map((e) => (
          <Row key={e.id} label={e.title} points={myAttendance[e.id]?.pointValue || 0} />
        ))
      )}
    </CyberModal>
  );
}
