import { usePoints } from "../context/PointsContext";

const CIRCUIT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='220' viewBox='0 0 420 220' fill='none' stroke='%23dedede' stroke-width='1.2'%3E%3Cpath d='M200 20h60l20 20h80'/%3E%3Cpath d='M240 60h90l20 20h50'/%3E%3Cpath d='M280 100h50l20 20h60'/%3E%3Cpath d='M220 150h80l20-20h80'/%3E%3Cpath d='M300 190h60l20-20h40'/%3E%3Ccircle cx='260' cy='20' r='3'/%3E%3Ccircle cx='360' cy='40' r='3'/%3E%3Ccircle cx='330' cy='60' r='3'/%3E%3Ccircle cx='380' cy='120' r='3'/%3E%3Ccircle cx='320' cy='150' r='3'/%3E%3C/svg%3E\")";

function splitName(full = "") {
  const [lastRaw, restRaw = ""] = full.split(",");
  const tokens = restRaw.trim().split(/\s+/).filter(Boolean);
  let middle = "";
  if (tokens.length > 1 && /^[A-Za-z]\.?$/.test(tokens[tokens.length - 1])) {
    middle = tokens.pop();
  }
  return { last: lastRaw.trim(), first: tokens.join(" "), middle: middle || "—" };
}

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="font-display text-[9px] uppercase tracking-[2px] text-[#2b0a0c]">{label}</p>
      <p className="mt-1 break-words text-[11px] uppercase tracking-[1.5px] text-[#4d4d4d]">
        {value || "—"}
      </p>
    </div>
  );
}

function PointsBar({ total, target }) {
  const segments = target > 0 ? Math.min(target, 40) : 10;
  const filled = target > 0 ? Math.round((Math.min(total, target) / target) * segments) : 0;
  return (
    <div
      role="img"
      aria-label={`${total} of ${target} points`}
      className="flex flex-1 gap-[2px] rounded-[3px] border border-[#6b1519] bg-white p-[3px]"
    >
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={`h-4 flex-1 rounded-[1px] ${i < filled ? "bg-[#6b1519]" : "bg-[#f2b400]"}`}
        />
      ))}
    </div>
  );
}

export default function ActivityCard({ student, onShowBreakdown }) {
  const { totalPoints, targetPoints, cleared } = usePoints();
  const { last, first, middle } = splitName(student.name);
  const program = (student.course || "").replace(/^BS\s+/i, "Bachelor of Science in ");
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  return (
    <div
      className="rounded-[10px] border-2 border-[var(--gold)] bg-white bg-right-top bg-no-repeat p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-6"
      style={{ backgroundImage: CIRCUIT_BG }}
    >
      <h2 className="font-display text-lg tracking-[4px] text-[#2b0a0c] sm:text-2xl">
        ACTIVITY CARD POINTS
      </h2>
      <div className="mb-5 mt-2 h-px bg-[#2b0a0c]" />

      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex h-[150px] w-[140px] shrink-0 items-center justify-center rounded-sm bg-gradient-to-b from-[#7a1317] to-[#2b0a0c] font-display text-4xl text-white shadow-[4px_4px_10px_rgba(0,0,0,0.35)]">
          {initials}
        </div>

        <div className="grid flex-1 grid-cols-3 content-start gap-x-4 gap-y-4">
          <Field label="Last Name" value={last} />
          <Field label="First Name" value={first} />
          <Field label="Middle Name" value={middle} />
          <Field label="Program" value={program} className="col-span-3" />
          <Field label="Year" value={student.yearLevel} />
          <Field label="Student ID" value={student.studentId} />
          <Field label="Role" value="Student" />
        </div>
      </div>

      <p className="mt-5 font-display text-[9px] uppercase tracking-[2px] text-[#2b0a0c]">
        Activity Points
      </p>
      <div className="mt-2 flex items-center gap-3">
        <PointsBar total={totalPoints} target={targetPoints} />
        <span className="shrink-0 text-xs font-semibold tracking-[1px] text-[#4d4d4d]">
          {totalPoints}/{targetPoints}
        </span>
      </div>
      {cleared && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[2px] text-[#2f7d32]">
          Cleared
        </p>
      )}

      <button
        type="button"
        onClick={onShowBreakdown}
        className="mt-4 block w-full text-center text-[8px] uppercase italic tracking-[2px] text-[#777] hover:text-[#2b0a0c]"
      >
        Tap here to view the breakdown of points
      </button>
    </div>
  );
}
