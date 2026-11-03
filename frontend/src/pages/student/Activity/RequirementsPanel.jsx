import { FiCheck } from "react-icons/fi";
import Panel from "../../../components/student/Panel";
import { useRequirements } from "../../../context/student/RequirementsContext";

export default function RequirementsPanel() {
  const { items, isCompleted } = useRequirements();

  return (
    <Panel title="Requirements">
      {items.length === 0 ? (
        <p className="st-muted text-sm">No requirements have been posted yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const done = isCompleted(item.id);
            return (
              <li key={item.id} className="st-inset flex items-center gap-3 px-3 py-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-[var(--ok)] text-white"
                      : "border-2 border-dashed border-[var(--text-faint)] text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  <FiCheck size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="st-muted block text-xs">{done ? "Completed" : "Not yet completed"}</span>
                </span>
                <span
                  className={`st-chip shrink-0 ${
                    done ? "bg-[var(--gold)] text-[var(--on-gold)]" : "bg-[var(--card)] text-[var(--text-muted)]"
                  }`}
                >
                  {item.pointValue} pts
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
