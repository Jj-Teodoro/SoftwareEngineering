import { FiAward } from "react-icons/fi";
import Panel from "../../../components/student/Panel";
import { useEvents } from "../../../context/student/EventsContext";

export default function RecentActivities() {
  const { attended, myAttendance } = useEvents();

  const recent = [...attended]
    .sort((a, b) =>
      (myAttendance[b.id]?.timeIn || "").localeCompare(myAttendance[a.id]?.timeIn || "")
    )
    .slice(0, 5);

  return (
    <Panel title="Recent activities" className="flex flex-col">
      {recent.length === 0 ? (
        <p className="st-muted flex-1 py-6 text-center text-sm">No activities yet. Events you attend show up here.</p>
      ) : (
        <ul className="flex-1 space-y-2">
          {recent.map((event) => {
            const points = myAttendance[event.id]?.pointValue || 0;
            return (
              <li key={event.id} className="st-inset flex items-center gap-3 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--gold)_20%,transparent)] text-[var(--accent-text)]">
                  <FiAward size={16} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{event.title}</span>
                <span className="st-chip shrink-0 bg-[var(--gold)] text-[var(--on-gold)]">+{points} pts</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
