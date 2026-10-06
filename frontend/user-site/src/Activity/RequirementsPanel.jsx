import Panel from "../components/Panel";
import { useRequirements } from "../context/RequirementsContext";

function RequirementBar({ done }) {
  return (
    <div
      role="img"
      aria-label={done ? "Completed" : "Not completed"}
      className="flex gap-[2px] rounded-[3px] border border-[var(--gold)] bg-[#2b0a0c] p-[3px]"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={`h-3 flex-1 rounded-[1px] ${done ? "bg-[#f2b400]" : "bg-white"}`}
        />
      ))}
    </div>
  );
}

export default function RequirementsPanel() {
  const { items, isCompleted } = useRequirements();

  return (
    <Panel title="Requirements">
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No requirements have been posted yet.</p>
      ) : (
        <ul className="space-y-5">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 sm:grid-cols-[1fr_190px_120px]"
            >
              <span className="text-xs font-medium uppercase tracking-[2px] text-[var(--text-primary)] sm:text-sm">
                {item.title}
              </span>
              <span className="order-last col-span-2 sm:order-none sm:col-span-1">
                <RequirementBar done={isCompleted(item.id)} />
              </span>
              <span className="text-right text-xs font-semibold uppercase tracking-[3px] text-[var(--text-primary)] sm:text-sm">
                {item.pointValue} points
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
