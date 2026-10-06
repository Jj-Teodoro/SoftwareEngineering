import Modal from "@oasis/shared/components/Modal.jsx";
import { useEvents } from "../context/EventsContext";
import { useRequirements } from "../context/RequirementsContext";
import { usePoints } from "../context/PointsContext";

function Row({ label, points }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2 text-sm">
      <span className="text-white/90">{label}</span>
      <span className="shrink-0 font-bold text-[#f2b400]">+{points} pts</span>
    </div>
  );
}

export default function PointsBreakdownModal({ onClose }) {
  const { items, isCompleted } = useRequirements();
  const { attended, myAttendance } = useEvents();
  const { totalPoints, targetPoints } = usePoints();

  const doneRequirements = items.filter((i) => isCompleted(i.id));

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <h2 className="mb-1 font-display text-lg uppercase tracking-[2px] text-white">
        Points Breakdown
      </h2>
      <p className="mb-5 text-xs text-white/60">
        {totalPoints} of {targetPoints} points earned
      </p>

      <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[2px] text-[#f2b400]">
        Requirements
      </h3>
      {doneRequirements.length === 0 ? (
        <p className="mb-4 py-2 text-sm text-white/50">None completed yet.</p>
      ) : (
        <div className="mb-4">
          {doneRequirements.map((r) => (
            <Row key={r.id} label={r.title} points={r.pointValue} />
          ))}
        </div>
      )}

      <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[2px] text-[#f2b400]">
        Events attended
      </h3>
      {attended.length === 0 ? (
        <p className="py-2 text-sm text-white/50">No events attended yet.</p>
      ) : (
        attended.map((e) => (
          <Row key={e.id} label={e.title} points={myAttendance[e.id]?.pointValue || 0} />
        ))
      )}
    </Modal>
  );
}
