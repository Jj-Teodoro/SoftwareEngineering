import { useRef, useState } from "react";
import { formatEventDate, getEventPhase } from "@oasis/shared/utils/events.js";
import CyberModal from "./CyberModal";
import { useEvents } from "../context/EventsContext";
import { useRequirements } from "../context/RequirementsContext";
import { usePoints } from "../context/PointsContext";

const GOLD = "var(--gold)";
const CYAN = "var(--neon-cyan)";
const MUTED = "rgba(255,255,255,0.14)";

const sum = (list, pick) => list.reduce((total, x) => total + pick(x), 0);
const pctOf = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

// ---------------------------------------------------------------- hover tooltip
function useTooltip() {
  const box = useRef(null);
  const [tip, setTip] = useState(null);

  const move = (e, content) => {
    const rect = box.current.getBoundingClientRect();
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, content, width: rect.width });
  };
  const bind = (content) => ({
    onMouseEnter: (e) => move(e, content),
    onMouseMove: (e) => move(e, content),
    onMouseLeave: () => setTip(null),
  });

  const node = tip && (
    <div
      className="pointer-events-none absolute z-20 w-52 border border-[var(--neon-cyan)] bg-black/90 px-3 py-2 shadow-[0_0_14px_rgba(5,217,232,0.35)]"
      style={{
        left: Math.min(Math.max(tip.x + 14, 4), tip.width - 212),
        top: tip.y + 16,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[2px] text-[var(--neon-cyan)]">{tip.content.tag}</p>
      <p className="mt-0.5 text-xs font-bold uppercase tracking-[1px] text-white">{tip.content.title}</p>
      {tip.content.lines.map((line) => (
        <p key={line} className="font-mono text-[11px] text-white/70">{line}</p>
      ))}
    </div>
  );

  return { box, bind, node };
}

// ---------------------------------------------------------------- donut chart
const R = 62;
const CIRC = 2 * Math.PI * R;
const GAP = 3;

function Donut({ segments, centerTop, centerBottom, bind }) {
  const total = sum(segments, (s) => s.value) || 1;
  let offset = 0;

  return (
    <svg viewBox="0 0 180 180" className="mx-auto w-full max-w-[210px]" role="img" aria-label="Points breakdown chart">
      {/* robotic outer ring: slow rotating dashes + fixed ticks */}
      <g style={{ transformOrigin: "90px 90px", animation: "spin-slow 40s linear infinite" }}>
        <circle cx="90" cy="90" r="82" fill="none" stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 6" />
      </g>
      <circle cx="90" cy="90" r="76" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {Array.from({ length: 36 }).map((_, i) => (
        <line
          key={i}
          x1="90" y1="9" x2="90" y2={i % 3 === 0 ? 15 : 12}
          stroke="rgba(255,255,255,0.25)" strokeWidth="1"
          transform={`rotate(${i * 10} 90 90)`}
        />
      ))}

      <g transform="rotate(-90 90 90)">
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
        {segments.map((seg) => {
          const length = Math.max(0, (seg.value / total) * CIRC - GAP);
          const start = offset;
          offset += (seg.value / total) * CIRC;
          if (seg.value <= 0) return null;
          return (
            <circle
              key={seg.key}
              cx="90" cy="90" r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${length} ${CIRC}`}
              strokeDashoffset={-start}
              className="cursor-pointer transition-[stroke-width] duration-150 hover:[stroke-width:23px]"
              style={{ filter: seg.glow ? `drop-shadow(0 0 4px ${seg.color})` : undefined, animation: "ring-in 0.9s ease-out" }}
              {...bind(seg.tip)}
            />
          );
        })}
      </g>

      <text x="90" y="86" textAnchor="middle" className="fill-white" style={{ font: "700 26px 'Share Tech Mono', monospace" }}>
        {centerTop}
      </text>
      <text x="90" y="104" textAnchor="middle" fill="var(--gold)" style={{ font: "10px 'Share Tech Mono', monospace", letterSpacing: "2px" }}>
        {centerBottom}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------- segmented bar
function SegBar({ value, total, color, tip, bind, segments = 20 }) {
  const filled = total > 0 ? Math.round((value / total) * segments) : 0;
  return (
    <div className="flex cursor-pointer gap-[3px]" {...bind(tip)}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-3.5 flex-1 -skew-x-[18deg] transition-opacity hover:opacity-80"
          style={{
            background: i < filled ? color : MUTED,
            boxShadow: i < filled ? `0 0 6px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function Module({ label, color, earned, total, doneCount, count, bind }) {
  const pct = pctOf(earned, total);
  const tip = {
    tag: label,
    title: `${earned} of ${total} pts`,
    lines: [`${doneCount} of ${count} completed`, `${pct}% of this module`],
  };
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between font-mono text-[11px] uppercase tracking-[2px]">
        <span style={{ color }}>{label}</span>
        <span className="text-white/70">
          {earned}/{total} <span className="text-white/40">· {pct}%</span>
        </span>
      </div>
      <SegBar value={earned} total={total} color={color} tip={tip} bind={bind} />
    </div>
  );
}

// ---------------------------------------------------------------- item rows
function ItemRow({ item, maxPts, bind }) {
  const color = item.kind === "req" ? GOLD : CYAN;
  const tip = {
    tag: item.kind === "req" ? "Requirement" : "Event",
    title: item.title,
    lines: item.lines,
  };
  return (
    <li
      className="group cursor-pointer border-b border-dashed border-[rgba(242,180,0,0.2)] py-2 last:border-0"
      {...bind(tip)}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rotate-45"
          style={{ background: item.done ? color : "transparent", border: `1px solid ${color}`, boxShadow: item.done ? `0 0 6px ${color}` : "none" }}
        />
        <span className={`min-w-0 flex-1 truncate text-sm ${item.done ? "text-white" : "text-white/55"}`}>{item.title}</span>
        <span className="shrink-0 font-mono text-xs" style={{ color: item.done ? color : "rgba(255,255,255,0.4)" }}>
          {item.done ? "+" : ""}{item.pts} pts
        </span>
      </div>
      <div className="mt-1.5 h-[3px] bg-white/10">
        <div
          className="h-full transition-all group-hover:brightness-125"
          style={{ width: `${Math.max(8, (item.pts / maxPts) * 100)}%`, background: item.done ? color : "rgba(255,255,255,0.25)" }}
        />
      </div>
    </li>
  );
}

function ItemList({ title, color, items, maxPts, bind }) {
  return (
    <div>
      <h3 className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[3px]" style={{ color }}>
        // {title}
      </h3>
      {items.length === 0 ? (
        <p className="py-2 font-mono text-xs text-[var(--text-faint)]">None posted yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} maxPts={maxPts} bind={bind} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- modal
export default function PointsBreakdownModal({ onClose }) {
  const { items, isCompleted } = useRequirements();
  const { events, myAttendance } = useEvents();
  const { totalPoints, targetPoints, cleared } = usePoints();
  const { box, bind, node } = useTooltip();

  const requirements = items.map((i) => {
    const done = isCompleted(i.id);
    return {
      id: `r-${i.id}`, kind: "req", title: i.title, pts: i.pointValue || 0, done,
      lines: [done ? "Status: completed" : "Status: not completed yet", `Worth ${i.pointValue || 0} pts`],
    };
  });

  const eventItems = events.map((e) => {
    const record = myAttendance[e.id];
    const phase = getEventPhase(e);
    const status = record ? "Status: attended" : phase === "upcoming" ? "Status: upcoming" : phase === "today" ? "Status: happening today" : "Status: missed";
    return {
      id: `e-${e.id}`, kind: "ev", title: e.title, pts: e.pointValue || 0, done: Boolean(record),
      earned: record?.pointValue ?? 0,
      lines: [formatEventDate(e.date), status, `Worth ${e.pointValue || 0} pts`],
    };
  });

  const reqEarned = sum(requirements.filter((r) => r.done), (r) => r.pts);
  const reqTotal = sum(requirements, (r) => r.pts);
  const evEarned = sum(eventItems.filter((e) => e.done), (e) => e.earned);
  const evTotal = sum(eventItems, (e) => e.pts);
  const remaining = Math.max(0, targetPoints - totalPoints);
  const maxPts = Math.max(1, ...requirements.map((r) => r.pts), ...eventItems.map((e) => e.pts));

  const segments = [
    { key: "req", value: reqEarned, color: GOLD, glow: true, tip: { tag: "Requirements", title: `${reqEarned} pts earned`, lines: [`${pctOf(reqEarned, targetPoints)}% of your target`] } },
    { key: "ev", value: evEarned, color: CYAN, glow: true, tip: { tag: "Events", title: `${evEarned} pts earned`, lines: [`${pctOf(evEarned, targetPoints)}% of your target`] } },
    { key: "left", value: remaining, color: MUTED, tip: { tag: "Remaining", title: `${remaining} pts to go`, lines: [`${pctOf(remaining, targetPoints)}% of your target`] } },
  ];

  const overall = pctOf(totalPoints, targetPoints);

  return (
    <CyberModal onClose={onClose} maxWidth="max-w-3xl" tag="sys://points_telemetry">
      <style>{`
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        @keyframes ring-in { from { stroke-dasharray: 0 ${CIRC}; opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { svg * { animation: none !important; } }
      `}</style>

      <div ref={box} className="relative">
        {node}

        <h2 className="cp-glitch font-display text-lg uppercase tracking-[2px] text-[var(--panel-title)]">Points Breakdown</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-xs uppercase tracking-[1px]">
          <span className="text-[var(--neon-cyan)]">&gt; {totalPoints} / {targetPoints} points earned</span>
          <span
            className="border px-2 py-0.5 text-[10px] tracking-[2px]"
            style={{ borderColor: cleared ? "#19f5b0" : GOLD, color: cleared ? "#19f5b0" : GOLD }}
          >
            {cleared ? "CLEARED" : `${remaining} PTS TO CLEAR`}
          </span>
        </p>

        <div className="mt-5 grid items-center gap-6 sm:grid-cols-[210px_1fr]">
          <Donut
            segments={segments}
            centerTop={`${overall}%`}
            centerBottom="COMPLETE"
            bind={bind}
          />
          <div className="space-y-5">
            <Module label="Requirements" color={GOLD} earned={reqEarned} total={reqTotal}
              doneCount={requirements.filter((r) => r.done).length} count={requirements.length} bind={bind} />
            <Module label="Events" color={CYAN} earned={evEarned} total={evTotal}
              doneCount={eventItems.filter((e) => e.done).length} count={eventItems.length} bind={bind} />
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[2px] text-white/55">
              <span><i className="mr-1.5 inline-block h-2 w-2 -skew-x-[18deg]" style={{ background: GOLD }} />Requirements</span>
              <span><i className="mr-1.5 inline-block h-2 w-2 -skew-x-[18deg]" style={{ background: CYAN }} />Events</span>
              <span><i className="mr-1.5 inline-block h-2 w-2 -skew-x-[18deg]" style={{ background: MUTED }} />Remaining</span>
            </div>
          </div>
        </div>

        <div className="my-5 h-px bg-[var(--surface-border)]" />

        <div className="grid gap-6 sm:grid-cols-2">
          <ItemList title="Requirements" color={GOLD} items={requirements} maxPts={maxPts} bind={bind} />
          <ItemList title="Events" color={CYAN} items={eventItems} maxPts={maxPts} bind={bind} />
        </div>

        <p className="mt-5 font-mono text-[10px] uppercase tracking-[2px] text-white/35">
          Hover any segment, bar or item for details
        </p>
      </div>
    </CyberModal>
  );
}
