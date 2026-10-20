import { FaRegStar, FaStar } from "react-icons/fa";
import { useEvents } from "../context/EventsContext";

const poly = (tl, tr, br, bl) =>
  `polygon(${tl}px 0, calc(100% - ${tr}px) 0, 100% ${tr}px, 100% calc(100% - ${br}px), calc(100% - ${br}px) 100%, ${bl}px 100%, 0 calc(100% - ${bl}px), 0 ${tl}px)`;

const GRID_BG = [
  "linear-gradient(rgba(242,180,0,0.07) 1px, transparent 1px)",
  "linear-gradient(90deg, rgba(242,180,0,0.07) 1px, transparent 1px)",
  "linear-gradient(160deg, #4d0f12 0%, #240607 55%, #130303 100%)",
].join(", ");

const SCANLINES =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)";

const GLITCH_TITLE = {
  textShadow:
    "1.5px 0 rgba(255,42,109,0.75), -1.5px 0 rgba(5,217,232,0.65), 0 0 12px rgba(242,180,0,0.5)",
};

function Slashes({ className = "" }) {
  return (
    <span className={`pointer-events-none absolute flex gap-1 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="h-3.5 w-1 -skew-x-[30deg] bg-[var(--gold)]"
          style={{ opacity: 1 - i * 0.28 }}
        />
      ))}
    </span>
  );
}

function Stars({ points }) {
  const filled = points > 0 ? Math.max(1, Math.min(5, Math.ceil(points / 5))) : 0;
  return (
    <span
      className="flex justify-end gap-0.5 text-[var(--gold)]"
      style={{ filter: "drop-shadow(0 0 3px rgba(242,180,0,0.8))" }}
      aria-label={`${filled} of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) =>
        i < filled ? <FaStar key={i} size={12} /> : <FaRegStar key={i} size={12} />
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
    <div className="h-full" style={{ filter: "drop-shadow(0 0 8px rgba(242,180,0,0.45))" }}>
      <div
        style={{ clipPath: poly(30, 10, 30, 10) }}
        className="h-full bg-[var(--gold)] p-[3px]"
      >
        <div
          style={{
            clipPath: poly(27, 7, 27, 7),
            backgroundImage: GRID_BG,
            backgroundSize: "18px 18px, 18px 18px, 100% 100%",
          }}
          className="relative flex h-full flex-col px-5 pb-8 pt-7 text-white"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{ backgroundImage: SCANLINES }}
            aria-hidden="true"
          />

          <div className="relative mb-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-[2px] text-[var(--gold)]">
            <span className="pl-5">sys://activity_log</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff2a6d] shadow-[0_0_6px_#ff2a6d]" />
              live
            </span>
          </div>

          <h3
            className="relative text-center font-display text-base uppercase leading-snug tracking-[3px] text-white"
            style={GLITCH_TITLE}
          >
            Recent
            <br />
            Activities
          </h3>

          <div className="relative my-4 flex items-center gap-1" aria-hidden="true">
            <span className="h-[2px] w-10 bg-[var(--gold)] shadow-[0_0_6px_rgba(242,180,0,0.9)]" />
            <span className="h-px flex-1 bg-[rgba(242,180,0,0.35)]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[var(--gold)]" />
          </div>

          {recent.length === 0 ? (
            <p className="relative flex-1 py-6 text-center font-mono text-xs text-[var(--gold)]">
              &gt; NO ACTIVITIES YET<span className="cursor-blink">_</span>
            </p>
          ) : (
            <ul className="relative flex-1 space-y-2.5">
              {recent.map((event, i) => {
                const points = myAttendance[event.id]?.pointValue || 0;
                return (
                  <li
                    key={event.id}
                    className="flex items-center gap-3 border-b border-dashed border-[rgba(242,180,0,0.28)] pb-2"
                  >
                    <span className="font-mono text-[10px] text-[var(--gold)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[11px] font-semibold uppercase leading-tight tracking-[1px]">
                      {event.title}
                    </span>
                    <span className="shrink-0">
                      <Stars points={points} />
                      <span className="block text-right font-mono text-[8px] uppercase tracking-[1px] text-[var(--gold)]">
                        +{points} pts
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
            className="relative mt-5 block w-full text-center font-mono text-[9px] uppercase leading-relaxed tracking-[2px] text-[var(--gold)] opacity-80 transition-opacity hover:opacity-100"
          >
            [ tap to view
            <br />
            point breakdown ]
          </button>

          <Slashes className="bottom-3 left-5" />
          <Slashes className="right-5 top-3" />
        </div>
      </div>
    </div>
  );
}
