import aces_logo from "../assets/aceslogo.png";
import Barcode from "./Barcode.jsx";

const GOLD = "#f2b400";
const LABEL = "#e8b43a"; // warm gold for small captions
const GREEN = "#19f5b0";
const PINK = "#ff2a6d";

// Cut-corner outline (top-left and bottom-right are the big cuts).
const poly = (big, small) =>
  `polygon(${big}px 0, calc(100% - ${small}px) 0, 100% ${small}px, 100% calc(100% - ${big}px), calc(100% - ${big}px) 100%, ${small}px 100%, 0 calc(100% - ${small}px), 0 ${big}px)`;

const GRID =
  "linear-gradient(rgba(242,180,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(242,180,0,0.06) 1px, transparent 1px)";

// faint circuit traces behind the personal details
const CIRCUIT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='220' viewBox='0 0 420 220' fill='none' stroke='%23f2b400' stroke-opacity='0.16' stroke-width='1.2'%3E%3Cpath d='M200 20h60l20 20h80'/%3E%3Cpath d='M240 60h90l20 20h50'/%3E%3Cpath d='M280 100h50l20 20h60'/%3E%3Cpath d='M220 150h80l20-20h80'/%3E%3Cpath d='M300 190h60l20-20h40'/%3E%3Ccircle cx='260' cy='20' r='3'/%3E%3Ccircle cx='360' cy='40' r='3'/%3E%3Ccircle cx='330' cy='60' r='3'/%3E%3Ccircle cx='380' cy='120' r='3'/%3E%3Ccircle cx='320' cy='150' r='3'/%3E%3C/svg%3E\")";

export function splitName(full = "") {
  const [lastRaw, restRaw = ""] = full.split(",");
  const tokens = restRaw.trim().split(/\s+/).filter(Boolean);
  let middle = "";
  if (tokens.length > 1 && /^[A-Za-z]\.?$/.test(tokens[tokens.length - 1])) {
    middle = tokens.pop();
  }
  return { last: lastRaw.trim(), first: tokens.join(" "), middle: middle || "—" };
}

function Field({ label, value, className = "", plain = false }) {
  return (
    <div className={className}>
      <p className="font-mono text-[10px] uppercase tracking-[2px]" style={{ color: LABEL }}>
        {label}
      </p>
      <p
        className={`mt-1 whitespace-pre-line break-words text-[13px] font-semibold text-white ${
          plain ? "tracking-[0.5px]" : "uppercase tracking-[1.5px]"
        }`}
      >
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
          <stop offset="0.5" stopColor={GOLD} />
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
      className="flex flex-1 gap-[3px] border border-[#f2b400]/50 bg-black/40 p-[3px]"
    >
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-4 flex-1 -skew-x-[18deg]"
          style={{
            background: i < filled ? GOLD : "rgba(255,255,255,0.1)",
            boxShadow: i < filled ? "0 0 6px rgba(242,180,0,0.7)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// Four L-shaped brackets framing the photo.
function Brackets() {
  const corner = "pointer-events-none absolute h-3.5 w-3.5 border-[#f2b400]";
  return (
    <>
      <span className={`${corner} -left-1.5 -top-1.5 border-l-2 border-t-2`} />
      <span className={`${corner} -right-1.5 -top-1.5 border-r-2 border-t-2`} />
      <span className={`${corner} -bottom-1.5 -left-1.5 border-b-2 border-l-2`} />
      <span className={`${corner} -bottom-1.5 -right-1.5 border-b-2 border-r-2`} />
    </>
  );
}

/**
 * The student ID card, shared by the User site (student view, with edit
 * controls passed in through the slots) and the Admin site (read-only view).
 *
 * Slots: `titleAction` (button beside the title), `photoOverlay` (rendered
 * inside the photo frame), `aboutSlot` (replaces the bio/talent/hobbies block).
 */
export default function StudentIdCard({
  student,
  totalPoints = 0,
  targetPoints = 0,
  cleared = false,
  onShowBreakdown,
  titleAction,
  photoOverlay,
  aboutSlot,
}) {
  const { last, first, middle } = splitName(student.name);
  const program = (student.course || "").replace(/^BS\s+/i, "Bachelor of Science in ");
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  const hobbies = student.hobbies || [];
  const remaining = Math.max(0, targetPoints - totalPoints);
  const percent = targetPoints > 0 ? Math.min(100, Math.round((totalPoints / targetPoints) * 100)) : 0;

  return (
    <div style={{ filter: "drop-shadow(0 0 12px rgba(242,180,0,0.3))" }}>
      <div
        className="p-[2px]"
        style={{
          clipPath: poly(30, 12),
          background: "linear-gradient(135deg, #fbe08a, #f2b400 35%, #b98500 65%, #f2b400)",
        }}
      >
        <div
          className="relative overflow-hidden text-white"
          style={{
            clipPath: poly(28, 11),
            backgroundImage: `${GRID}, linear-gradient(165deg, #3a0a0d 0%, #1b0506 50%, #0e0304 100%)`,
            backgroundSize: "20px 20px, 20px 20px, 100% 100%",
          }}
        >
          {/* scanlines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)" }}
            aria-hidden="true"
          />
          {/* lanyard slot */}
          <span
            className="absolute left-1/2 top-2 z-10 h-2.5 w-16 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_2px_3px_rgba(0,0,0,0.9),0_0_0_1px_rgba(242,180,0,0.45)]"
            aria-hidden="true"
          />

          <div className="relative">
            {/* header band */}
            <div className="flex items-center gap-3 border-b border-[#f2b400]/50 bg-gradient-to-r from-[#7a1317]/80 via-[#4a0d10]/80 to-transparent px-5 pb-3 pt-6">
              <img
                src={aces_logo}
                alt="ACES"
                className="h-11 w-11 shrink-0 rounded-full border-2 border-[#f2b400] bg-white object-contain shadow-[0_0_10px_rgba(242,180,0,0.5)]"
              />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[11px] font-extrabold uppercase tracking-[2px] sm:text-xs">
                  Dr. Yanga's Colleges, Inc.
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-white/70">
                  College of Computer Studies · ACES
                </p>
              </div>
              <p
                className="hidden shrink-0 items-center gap-2 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[3px] sm:flex"
                style={{ color: GOLD, borderColor: "rgba(242,180,0,0.6)" }}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: PINK, boxShadow: `0 0 6px ${PINK}` }} />
                Member ID
              </p>
            </div>

            <div className="bg-right-top bg-no-repeat px-5 pb-4 pt-5 sm:px-6" style={{ backgroundImage: CIRCUIT_BG }}>
              <div className="flex items-start justify-between gap-3">
                <h2
                  className="font-display text-lg tracking-[3px] sm:text-2xl"
                  style={{ textShadow: "1.5px 0 rgba(255,42,109,.6), 0 0 14px rgba(242,180,0,.55)" }}
                >
                  ACTIVITY CARD POINTS
                </h2>
                {titleAction}
              </div>
              <div className="mb-5 mt-2 flex items-center gap-1" aria-hidden="true">
                <span className="h-[2px] w-12" style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
                <span className="h-px flex-1 bg-[#f2b400]/30" />
                <span className="h-1.5 w-1.5 rotate-45" style={{ background: GOLD }} />
              </div>

              <div className="flex flex-col gap-5 sm:flex-row">
                {/* photo */}
                <div className="relative shrink-0 self-start">
                  <Brackets />
                  <div className="bg-gradient-to-br from-[#fbe08a] via-[#f2b400] to-[#b98500] p-[2px] shadow-[0_0_14px_rgba(242,180,0,0.35)]">
                    <div className="relative flex h-[150px] w-[128px] items-center justify-center overflow-hidden bg-gradient-to-b from-[#7a1317] to-[#2b0a0c] font-display text-4xl">
                      {student.photo ? (
                        <img src={student.photo} alt={`${student.name} photo`} className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                      {/* faint scan line over the photo */}
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(242,180,0,0.06) 0, rgba(242,180,0,0.06) 1px, transparent 1px, transparent 4px)" }}
                      />
                      {photoOverlay}
                    </div>
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

              <div className="mt-5 border-t border-dashed border-[#f2b400]/30 pt-4">
                {aboutSlot ?? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Bio" value={student.bio} plain className="sm:col-span-2" />
                    <Field label="Talent" value={student.talent} plain />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[2px]" style={{ color: LABEL }}>
                        Hobbies
                      </p>
                      {hobbies.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {hobbies.map((h) => (
                            <span
                              key={h}
                              className="border border-[#f2b400]/50 bg-[#f2b400]/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[1px]"
                              style={{ color: GOLD }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-[13px] font-semibold">—</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[2px]" style={{ color: LABEL }}>
                  Activity Points
                </p>
                {cleared && (
                  <span
                    className="-rotate-3 border-2 px-2 py-0.5 font-display text-[10px] uppercase tracking-[2px]"
                    style={{ color: GREEN, borderColor: GREEN, boxShadow: "0 0 8px rgba(25,245,176,0.5)" }}
                  >
                    Cleared
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <PointsBar total={totalPoints} target={targetPoints} />
                <span className="shrink-0 font-mono text-sm font-bold tracking-[1px]" style={{ color: GOLD }}>
                  {totalPoints}/{targetPoints}
                </span>
              </div>

              {onShowBreakdown && (
                <button
                  type="button"
                  onClick={onShowBreakdown}
                  className="mt-3 block w-full text-center font-mono text-[10px] uppercase tracking-[2px] text-white/45 transition-colors hover:text-[#f2b400]"
                >
                  [ tap to view the breakdown of points ]
                </button>
              )}
            </div>

            {/* footer: barcode, live clearance status, chip */}
            <div className="flex items-stretch gap-3 border-t border-dashed border-[#f2b400]/30 bg-black/30 px-5 py-3 sm:px-6">
              <div className="w-[190px] max-w-[55%] shrink-0 border border-[#f2b400]/70 bg-[#f4ead0] px-2 pb-1 pt-1.5">
                <Barcode value={student.studentId} className="h-8 w-full" />
                <p className="mt-0.5 text-center font-mono text-[9px] tracking-[3px] text-[#2b0a0c]">
                  {student.studentId}
                </p>
              </div>

              <div
                className="hidden flex-1 flex-col justify-center border border-[#f2b400]/40 bg-gradient-to-r from-[#7a1317]/60 to-transparent px-4 sm:flex"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)" }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[3px]" style={{ color: LABEL }}>
                  Clearance status
                </p>
                <p
                  className="font-display text-sm uppercase tracking-[2px]"
                  style={{ color: cleared ? GREEN : "#fff" }}
                >
                  {cleared ? "Cleared" : targetPoints > 0 ? `${remaining} pts to clear` : "No target yet"}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[2px] text-white/55">
                  {percent}% complete · {totalPoints}/{targetPoints} pts
                </p>
              </div>

              <div className="hidden shrink-0 items-center sm:flex">
                <SmartChip />
              </div>
            </div>

            <p className="border-t border-[#f2b400]/40 bg-[#3d0a0d] py-1.5 text-center font-mono text-[9px] uppercase tracking-[2px] text-white/70">
              This ID remains the property of DYCI-CCS ACES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
