import { FiAward, FiCalendar, FiCheckSquare, FiClock } from "react-icons/fi";
import { useEvents } from "../../../context/student/EventsContext";
import { usePoints } from "../../../context/student/PointsContext";
import { useRequirements } from "../../../context/student/RequirementsContext";
import useCountUp from "../../../utils/useCountUp";

function Tile({ Icon, value, suffix = "", label }) {
  const shown = useCountUp(value);
  return (
    <div className="st-card flex items-center gap-3 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--gold)_20%,transparent)] text-[var(--accent-text)]">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="st-mono text-2xl font-extrabold leading-none">
          {shown}
          {suffix && <span className="text-sm font-bold text-[var(--text-muted)]">{suffix}</span>}
        </p>
        <p className="st-muted mt-1 text-xs">{label}</p>
      </div>
    </div>
  );
}

export default function StatTiles() {
  const { totalPoints, targetPoints } = usePoints();
  const { attended, upcoming } = useEvents();
  const { items, isCompleted } = useRequirements();
  const done = items.filter((item) => isCompleted(item.id)).length;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Tile Icon={FiAward} value={totalPoints} suffix={`/${targetPoints}`} label="Points earned" />
      <Tile Icon={FiCalendar} value={attended.length} label="Events attended" />
      <Tile Icon={FiCheckSquare} value={done} suffix={`/${items.length}`} label="Requirements done" />
      <Tile Icon={FiClock} value={upcoming.length} label="Upcoming events" />
    </div>
  );
}
