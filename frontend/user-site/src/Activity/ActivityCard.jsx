import aces_logo from "../assets/aceslogo.png";
import { usePoints } from "../context/PointsContext";
import Barcode from "./Barcode";

const CIRCUIT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='220' viewBox='0 0 420 220' fill='none' stroke='%23e3e3e3' stroke-width='1.2'%3E%3Cpath d='M200 20h60l20 20h80'/%3E%3Cpath d='M240 60h90l20 20h50'/%3E%3Cpath d='M280 100h50l20 20h60'/%3E%3Cpath d='M220 150h80l20-20h80'/%3E%3Cpath d='M300 190h60l20-20h40'/%3E%3Ccircle cx='260' cy='20' r='3'/%3E%3Ccircle cx='360' cy='40' r='3'/%3E%3Ccircle cx='330' cy='60' r='3'/%3E%3Ccircle cx='380' cy='120' r='3'/%3E%3Ccircle cx='320' cy='150' r='3'/%3E%3C/svg%3E\")";

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
      <p className="font-display text-[9px] uppercase tracking-[2px] text-[#7a1317]">{label}</p>
      <p className="mt-1 break-words text-[12px] font-semibold uppercase tracking-[1.5px] text-[#2b2b2b]">
        {value || "—"}
      </p>
    </div>
  );
}

function SmartChip() {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" aria-hidden="true">
      <defs>
        <linearGradient id="chip-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe08a" />
          <stop offset="0.5" stopColor="#f2b400" />
          <stop offset="1" stopColor="#b98500" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="40" height="30" rx="6" fill="url(#chip-gold)" stroke="#8a6200" />
      <g stroke="#8a6200" strokeWidth="1" fill="none" opacity="0.85">
        <path d="M1 11h12v10H1M41 11H29v10h12M13 1v10M29 1v10M13 21v10M29 21v10M13 11h16v10H13" />
      </g>
    </svg>
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
    <div className="relative overflow-hidden rounded-[18px] border-2 border-[var(--gold)] bg-white shadow-[0_14px_36px_rgba(0,0,0,0.45)]">
      <span
        className="absolute left-1/2 top-2 z-10 h-2.5 w-16 -translate-x-1/2 rounded-full bg-[#150404] shadow-[inset_0_2px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.25)]"
        aria-hidden="true"
      />

      <div className="flex items-center gap-3 bg-gradient-to-r from-[#7a1317] via-[#5e0f13] to-[#3d0a0d] px-5 pb-3 pt-6">
        <img
          src={aces_logo}
          alt="ACES"
          className="h-11 w-11 shrink-0 rounded-full border-2 border-[var(--gold)] bg-white object-contain"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-white sm:text-xs">
            Dr. Yanga's Colleges, Inc.
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[1.5px] text-white/80 sm:text-[10px]">
            College of Computer Studies · ACES
          </p>
        </div>
        <p className="hidden shrink-0 font-display text-[11px] uppercase tracking-[3px] text-[var(--gold)] sm:block">
          Member ID
        </p>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-[var(--gold)] via-[#fbe08a] to-[var(--gold)]" />

      <div
        className="bg-right-top bg-no-repeat px-5 pb-4 pt-5 sm:px-6"
        style={{ backgroundImage: CIRCUIT_BG }}
      >
        <h2 className="font-display text-lg tracking-[4px] text-[#2b0a0c] sm:text-2xl">
          ACTIVITY CARD POINTS
        </h2>
        <div className="mb-5 mt-2 h-px bg-gradient-to-r from-[#2b0a0c] to-transparent" />

        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="shrink-0 self-start rounded-[6px] bg-gradient-to-br from-[#fbe08a] via-[#f2b400] to-[#b98500] p-[3px] shadow-[4px_4px_12px_rgba(0,0,0,0.35)]">
            <div className="flex h-[150px] w-[128px] items-center justify-center rounded-[4px] bg-gradient-to-b from-[#7a1317] to-[#2b0a0c] font-display text-4xl text-white">
              {initials}
            </div>
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

        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="font-display text-[9px] uppercase tracking-[2px] text-[#7a1317]">
            Activity Points
          </p>
          {cleared && (
            <span className="-rotate-3 rounded-sm border-2 border-[#2f7d32] px-2 py-0.5 font-display text-[10px] uppercase tracking-[2px] text-[#2f7d32]">
              Cleared
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <PointsBar total={totalPoints} target={targetPoints} />
          <span className="shrink-0 text-xs font-bold tracking-[1px] text-[#2b2b2b]">
            {totalPoints}/{targetPoints}
          </span>
        </div>

        <button
          type="button"
          onClick={onShowBreakdown}
          className="mt-3 block w-full text-center text-[8px] uppercase italic tracking-[2px] text-[#777] hover:text-[#2b0a0c]"
        >
          Tap here to view the breakdown of points
        </button>
      </div>

      <div className="flex items-center gap-4 border-t border-dashed border-[#d6d6d6] bg-[#fafafa] px-5 py-3 sm:px-6">
        <div className="w-[190px] max-w-[55%] shrink-0">
          <Barcode value={student.studentId} className="h-9 w-full" />
          <p className="mt-1 text-center font-mono text-[9px] tracking-[3px] text-[#2b2b2b]">
            {student.studentId}
          </p>
        </div>
        <div
          className="hidden h-9 flex-1 items-center justify-center overflow-hidden rounded-sm sm:flex"
          style={{
            backgroundImage:
              "linear-gradient(115deg, rgba(242,180,0,0.6), rgba(255,42,109,0.4), rgba(5,217,232,0.45), rgba(242,180,0,0.6))",
          }}
          aria-hidden="true"
        >
          <span className="whitespace-nowrap font-display text-[7px] uppercase tracking-[3px] text-white/80">
            ACES ✦ OASIS ✦ ACES ✦ OASIS ✦ ACES ✦ OASIS
          </span>
        </div>
        <div className="hidden shrink-0 sm:block">
          <SmartChip />
        </div>
      </div>

      <p className="bg-[#3d0a0d] py-1.5 text-center text-[8px] uppercase tracking-[2px] text-white/80">
        This ID remains the property of DYCI-CCS ACES
      </p>
    </div>
  );
}
