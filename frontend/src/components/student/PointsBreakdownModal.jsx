import { useRef, useState } from "react";
import { formatEventDate, getEventPhase } from "../../utils/events.js";
import Modal from "./Modal";
import { useEvents } from "../../context/student/EventsContext";
import { useRequirements } from "../../context/student/RequirementsContext";
import { usePoints } from "../../context/student/PointsContext";

const GOLD = "var(--gold)";
const SERIES_B = "var(--series-b)";
const REMAINING = "var(--track)";

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
      className="pointer-events-none absolute z-20 w-52 rounded-2xl border bg-[var(--card)] px-3 py-2 shadow-[var(--shadow)]"
      style={{
        left: Math.min(Math.max(tip.x + 14, 4), tip.width - 212),
        top: tip.y + 16,
        borderColor: "var(--line)",
      }}
    >
      <p className="st-label">{tip.content.tag}</p>
      <p className="mt-0.5 text-sm font-bold">{tip.content.title}</p>
      {tip.content.lines.map((line) => (
        <p key={line} className="st-muted text-xs">
          {line}
        </p>
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
      <g transform="rotate(-90 90 90)">
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--track)" strokeWidth="18" />
        {segments.map((seg) => {
          const length = Math.max(0, (seg.value / total) * CIRC - GAP);
          const start = offset;
          offset += (seg.value / total) * CIRC;
          if (seg.value <= 0) return null;
          return (
            <circle
              key={seg.key}
              cx="90"
              cy="90"
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeDasharray={`${length} ${CIRC}`}
              strokeDashoffset={-start}
              className="cursor-pointer transition-[stroke-width] duration-150 hover:[stroke-width:22px]"
              {...bind(seg.tip)}
            />
          );
        })}
      </g>

      <text x="90" y="88" textAnchor="middle" fill="var(--text-primary)" style={{ font: "700 28px Inter, sans-serif" }}>
        {centerTop}
      </text>
      <text x="90" y="106" textAnchor="middle" fill="var(--text-muted)" style={{ font: "600 11px Inter, sans-serif" }}>
        {centerBottom}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------- segmented bar
function SegBar({ value, total, color, tip, bind, segments = 16 }) {
  const filled = total > 0 ? Math.round((value / total) * segments) : 0;
  return (
    <div className="flex cursor-pointer gap-1" {...bind(tip)}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-2.5 flex-1 rounded-full transition-opacity hover:opacity-80"
          style={{ background: i < filled ? color : "var(--track)" }}
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
      <div className="mb-2 flex items-end justify-between text-sm font-semibold">
        <span style={{ color }}>{label}</span>
        <span className="st-muted">
          {earned}/{total} <span className="text-[var(--text-faint)]">· {pct}%</span>
        </span>
      </div>
      <SegBar value={earned} total={total} color={color} tip={tip} bind={bind} />
    </div>
  );
}

// ---------------------------------------------------------------- item rows
function ItemRow({ item, maxPts, bind }) {
  const color = item.kind === "req" ? GOLD : SERIES_B;
  const tip = {
    tag: item.kind === "req" ? "Requirement" : "Event",
    title: item.title,
    lines: item.lines,
  };
  return (
    <li className="group cursor-pointer border-b py-2.5 last:border-0" style={{ borderColor: "var(--line)" }} {...bind(tip)}>
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: item.done ? color : "transparent", border: `2px solid ${color}` }}
        />
        <span className={`min-w-0 flex-1 truncate text-sm ${item.done ? "font-semibold" : "text-[var(--text-muted)]"}`}>
          {item.title}
        </span>
        <span className="shrink-0 text-xs font-semibold" style={{ color: item.done ? color : "var(--text-faint)" }}>
          {item.done ? "+" : ""}
          {item.pts} pts
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(8, (item.pts / maxPts) * 100)}%`,
            background: item.done ? color : "var(--text-faint)",
          }}
        />
      </div>
    </li>
  );
}

function ItemList({ title, color, items, maxPts, bind }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-bold" style={{ color }}>
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="st-muted py-2 text-sm">None posted yet.</p>
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
      id: `r-${i.id}`,
      kind: "req",
      title: i.title,
      pts: i.pointValue || 0,
      done,
      lines: [done ? "Status: completed" : "Status: not completed yet", `Worth ${i.pointValue || 0} pts`],
    };
  });

  const eventItems = events.map((e) => {
    const record = myAttendance[e.id];
    const phase = getEventPhase(e);
    const status = record
      ? "Status: attended"
      : phase === "upcoming"
      ? "Status: upcoming"
      : phase === "today"
      ? "Status: happening today"
      : "Status: missed";
    return {
      id: `e-${e.id}`,
      kind: "ev",
      title: e.title,
      pts: e.pointValue || 0,
      done: Boolean(record),
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
    {
      key: "req",
      value: reqEarned,
      color: GOLD,
      tip: { tag: "Requirements", title: `${reqEarned} pts earned`, lines: [`${pctOf(reqEarned, targetPoints)}% of your target`] },
    },
    {
      key: "ev",
      value: evEarned,
      color: SERIES_B,
      tip: { tag: "Events", title: `${evEarned} pts earned`, lines: [`${pctOf(evEarned, targetPoints)}% of your target`] },
    },
    {
      key: "left",
      value: remaining,
      color: REMAINING,
      tip: { tag: "Remaining", title: `${remaining} pts to go`, lines: [`${pctOf(remaining, targetPoints)}% of your target`] },
    },
  ];

  const overall = pctOf(totalPoints, targetPoints);

  return (
    <Modal onClose={onClose} maxWidth="max-w-3xl">
      <div ref={box} className="relative">
        {node}

        <h2 className="pr-10 text-xl font-bold">Points breakdown</h2>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="st-muted">
            {totalPoints} of {targetPoints} points earned
          </span>
          <span
            className="st-chip"
            style={{
              background: cleared ? "color-mix(in srgb, var(--ok) 15%, transparent)" : "var(--gold)",
              color: cleared ? "var(--ok)" : "var(--on-gold)",
            }}
          >
            {cleared ? "Cleared" : `${remaining} pts to clear`}
          </span>
        </p>

        <div className="mt-5 grid items-center gap-6 sm:grid-cols-[210px_1fr]">
          <Donut segments={segments} centerTop={`${overall}%`} centerBottom="complete" bind={bind} />
          <div className="space-y-5">
            <Module
              label="Requirements"
              color={GOLD}
              earned={reqEarned}
              total={reqTotal}
              doneCount={requirements.filter((r) => r.done).length}
              count={requirements.length}
              bind={bind}
            />
            <Module
              label="Events"
              color={SERIES_B}
              earned={evEarned}
              total={evTotal}
              doneCount={eventItems.filter((e) => e.done).length}
              count={eventItems.length}
              bind={bind}
            />
            <div className="st-muted flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span>
                <i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: GOLD }} />
                Requirements
              </span>
              <span>
                <i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: SERIES_B }} />
                Events
              </span>
              <span>
                <i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: REMAINING }} />
                Remaining
              </span>
            </div>
          </div>
        </div>

        <div className="my-5 h-px" style={{ background: "var(--line)" }} />

        <div className="grid gap-6 sm:grid-cols-2">
          <ItemList title="Requirements" color={GOLD} items={requirements} maxPts={maxPts} bind={bind} />
          <ItemList title="Events" color={SERIES_B} items={eventItems} maxPts={maxPts} bind={bind} />
        </div>

        <p className="mt-5 text-xs text-[var(--text-faint)]">Hover any segment, bar or item for details.</p>
      </div>
    </Modal>
  );
}
