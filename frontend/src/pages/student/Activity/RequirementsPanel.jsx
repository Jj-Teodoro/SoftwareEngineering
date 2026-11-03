import { FiCheck } from "react-icons/fi";
import Panel from "../../../components/student/Panel";
import { useRequirements } from "../../../context/student/RequirementsContext";

export default function RequirementsPanel() {
  const { items, isCompleted } = useRequirements();
  const done = items.filter((item) => isCompleted(item.id)).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <Panel
      title="Requirements"
      action={
        items.length > 0 && (
          <span className="st-chip bg-[color-mix(in_srgb,var(--gold)_20%,transparent)] text-[var(--accent-text)]">
            {done} of {items.length} done
          </span>
        )
      }
    >
      {items.length === 0 ? (
        <p className="st-muted text-sm">No requirements have been posted yet.</p>
      ) : (
        <>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--track)]">
            <div className="h-full rounded-full bg-[var(--gold)] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const complete = isCompleted(item.id);
              return (
                <li key={item.id} className="st-inset flex items-center gap-3 px-3 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      complete
                        ? "bg-[var(--ok)] text-white"
                        : "border-2 border-dashed border-[var(--text-faint)] text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    <FiCheck size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.title}</span>
                    <span className="st-muted block text-xs">{complete ? "Completed" : "Not yet completed"}</span>
                  </span>
                  <span
                    className={`st-chip shrink-0 ${
                      complete ? "bg-[var(--gold)] text-[var(--on-gold)]" : "bg-[var(--card)] text-[var(--text-muted)]"
                    }`}
                  >
                    {item.pointValue} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
