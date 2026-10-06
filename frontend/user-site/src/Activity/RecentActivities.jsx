import { FaRegStar, FaStar } from "react-icons/fa";
import { useEvents } from "../context/EventsContext";

const chamfer = (c) =>
  `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;

function Stars({ points }) {
  const filled = points > 0 ? Math.max(1, Math.min(5, Math.ceil(points / 5))) : 0;
  return (
    <span className="flex justify-end gap-0.5 text-[var(--gold)]" aria-label={`${filled} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < filled ? <FaStar key={i} size={13} /> : <FaRegStar key={i} size={13} />
      )}
    </span>
  );
}

export default function RecentActivities({ onShowBreakdown }) {
  const { attended, myAttendance } = useEvents();

  const recent = [...attended]
    .sort((a, b) =>
      (myAttendance[b.id]?.timeIn || "").localeCompare(myAttendance[a.id]?.timeIn || "")
    )
    .slice(0, 5);

  return (
    <div style={{ clipPath: chamfer(22) }} className="bg-[var(--gold)] p-[3px]">
      <div
        style={{ clipPath: chamfer(19) }}
        className="flex h-full flex-col bg-[var(--panel-bg)] px-5 py-6"
      >
        <h3 className="mb-5 text-center font-display text-base uppercase leading-snug tracking-[3px] text-[var(--panel-title)]">
          Recent
          <br />
          Activities
        </h3>

        {recent.length === 0 ? (
          <p className="flex-1 py-6 text-center text-xs text-[var(--text-muted)]">
            No activities yet.
          </p>
        ) : (
          <ul className="flex-1 space-y-3">
            {recent.map((event) => {
              const points = myAttendance[event.id]?.pointValue || 0;
              return (
                <li key={event.id} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase leading-tight tracking-[1px] text-[var(--text-primary)]">
                    {event.title}
                  </span>
                  <span className="shrink-0">
                    <Stars points={points} />
                    <span className="block text-right text-[8px] uppercase tracking-[1px] text-[var(--text-muted)]">
                      {points} points
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={onShowBreakdown}
          className="mt-5 block w-full text-center text-[8px] uppercase italic leading-relaxed tracking-[2px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Tap here to view the
          <br />
          breakdown of points
        </button>
      </div>
    </div>
  );
}
