import { FiAward } from "react-icons/fi";
import Panel from "../../../components/student/Panel";
import { useEvents } from "../../../context/student/EventsContext";
import { daysUntil } from "../../../utils/events.js";

const when = (days) => (days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`);

// The next event this student can still go to.
export default function UpNext() {
  const { upcoming } = useEvents();
  const next = [...upcoming].sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <Panel title="Up next">
      {!next ? (
        <p className="st-muted text-sm">No upcoming events for you right now. New ones show up here.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--gold)] text-[var(--on-gold)]">
            <span className="st-mono text-[11px] font-bold uppercase">
              {new Date(`${next.date}T00:00:00`).toLocaleDateString(undefined, { month: "short" })}
            </span>
            <span className="st-mono text-2xl font-extrabold leading-none">{new Date(`${next.date}T00:00:00`).getDate()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{next.title}</p>
            <p className="st-muted mt-0.5 text-xs">{when(daysUntil(next.date))}</p>
          </div>
          <span className="st-chip shrink-0 bg-[color-mix(in_srgb,var(--gold)_20%,transparent)] text-[var(--accent-text)]">
            <FiAward size={12} /> {next.pointValue} pts
          </span>
        </div>
      )}
    </Panel>
  );
}
