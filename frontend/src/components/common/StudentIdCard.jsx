import aces_logo from "../../assets/aceslogo.png";
import Barcode from "./Barcode.jsx";
import QrCode from "./QrCode.jsx";

const GOLD = "#f2b400";

export function splitName(full = "") {
  const [lastRaw, restRaw = ""] = full.split(",");
  const tokens = restRaw.trim().split(/\s+/).filter(Boolean);
  let middle = "";
  if (tokens.length > 1 && /^[A-Za-z]\.?$/.test(tokens[tokens.length - 1])) {
    middle = tokens.pop();
  }
  return { last: lastRaw.trim(), first: tokens.join(" "), middle: middle || "" };
}

function SmartChip() {
  return (
    <svg width="38" height="29" viewBox="0 0 42 32" aria-hidden="true">
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

/**
 * The card itself: a landscape, credit-card shaped student ID. Front only:
 * school header, photo, name, student number, program, barcode and QR code.
 */
export function IdCardFront({ student, photoOverlay }) {
  const { last, first, middle } = splitName(student.name);
  const program = (student.course || "").replace(/^BS\s+/i, "Bachelor of Science in ");
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  const yearSection = [student.yearLevel, student.section].filter(Boolean).join(" · ");

  return (
    <div
      className="mx-auto w-full max-w-[460px] rounded-2xl p-[2px] shadow-[0_14px_34px_rgba(0,0,0,0.45)]"
      style={{ background: "linear-gradient(135deg, #fbe08a, #f2b400 40%, #b98500 70%, #f2b400)" }}
    >
      <div
        className="relative overflow-hidden rounded-[14px] text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,180,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242,180,0,0.05) 1px, transparent 1px), linear-gradient(150deg, #6b1015 0%, #3a0a0d 55%, #1f0506 100%)",
          backgroundSize: "18px 18px, 18px 18px, 100% 100%",
        }}
      >
        {/* lanyard slot */}
        <span
          className="absolute left-1/2 top-1.5 z-10 h-2 w-12 -translate-x-1/2 rounded-full bg-black/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_0_0_1px_rgba(242,180,0,0.5)]"
          aria-hidden="true"
        />
        {/* gold sash behind the photo */}
        <span
          className="pointer-events-none absolute -left-8 top-[58px] h-24 w-[150%] -rotate-12 opacity-25"
          style={{ background: "linear-gradient(90deg, transparent, #f2b400 30%, transparent)" }}
          aria-hidden="true"
        />

        {/* header */}
        <div className="relative flex items-center gap-2.5 border-b border-[#f2b400]/60 bg-black/25 px-4 pb-2 pt-4">
          <img
            src={aces_logo}
            alt="ACES"
            className="h-9 w-9 shrink-0 rounded-full border-2 border-[#f2b400] bg-white object-contain"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12px] font-extrabold uppercase tracking-wide sm:text-[13px]">
              Dr. Yanga's Colleges, Inc.
            </p>
            <p className="st-mono mt-0.5 truncate text-[9.5px] font-bold uppercase tracking-wide text-[#f2b400] sm:text-[10px]">
              College of Computer Studies
            </p>
          </div>
          <span className="st-mono shrink-0 rounded bg-[#f2b400] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2a0507]">
            Student
          </span>
        </div>

        {/* body */}
        <div className="relative flex gap-3.5 px-4 pb-3 pt-3.5 sm:gap-4">
          <div className="relative h-[108px] w-[84px] shrink-0 overflow-hidden rounded-md border-[3px] border-white bg-gradient-to-b from-[#8c1a1f] to-[#3a0a0d] shadow-[0_4px_12px_rgba(0,0,0,0.5)] sm:h-[124px] sm:w-[96px]">
            {student.photo ? (
              <img src={student.photo} alt={`${student.name} photo`} className="h-full w-full object-cover" />
            ) : (
              <span className="st-mono flex h-full w-full items-center justify-center text-3xl font-bold text-white/90">
                {initials}
              </span>
            )}
            {photoOverlay}
          </div>

          <div className="min-w-0 flex-1">
            <p className="st-mono text-[9px] font-bold uppercase tracking-wider text-[#f2b400]">Name</p>
            <p className="break-words text-[17px] font-extrabold uppercase leading-tight sm:text-xl">{last || "—"}</p>
            <p className="break-words text-[13px] font-semibold uppercase leading-tight text-white/90 sm:text-sm">
              {[first, middle].filter(Boolean).join(" ")}
            </p>

            <p className="st-mono mt-2 text-[9px] font-bold uppercase tracking-wider text-[#f2b400]">Student no.</p>
            <p className="st-mono text-[17px] font-bold leading-tight tracking-wide text-[#f2b400] sm:text-xl">
              {student.studentId}
            </p>

            <p className="mt-2 text-[11px] font-medium leading-snug text-white/85 sm:text-xs">{program || "—"}</p>
            {yearSection && <p className="st-mono mt-0.5 text-[10px] text-white/60 sm:text-[11px]">{yearSection}</p>}
          </div>
        </div>

        {/* barcode strip: dark bars on a light background so scanners can read it */}
        <div className="relative flex items-center gap-3 border-t-2 border-[#f2b400] bg-[#fff8ea] px-4 py-2">
          <div className="hidden shrink-0 sm:block">
            <SmartChip />
          </div>
          <div className="min-w-0 flex-1 text-center">
            <Barcode value={student.studentId} color="#1a0a0b" className="mx-auto h-8 w-full" />
            <p className="st-mono mt-0.5 text-[9px] font-bold tracking-[3px] text-[#3a0a0d]">{student.studentId}</p>
          </div>
          <QrCode value={student.studentId} color="#1a0a0b" className="h-11 w-11 shrink-0" />
        </div>

        <p className="relative bg-black/40 py-1 text-center text-[8.5px] font-semibold uppercase tracking-[1.5px] text-white/65">
          This ID remains the property of DYCI-CCS ACES
        </p>
      </div>
    </div>
  );
}

function PointsMeter({ total, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
  return (
    <div
      role="img"
      aria-label={`${total} of ${target} points`}
      className="h-3 flex-1 overflow-hidden rounded-md bg-[var(--track)]"
    >
      <div className="h-full rounded-md bg-[var(--gold)]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * The ID card plus what sits behind it: activity points and the about block.
 * Shared by the User site (student view, with edit controls passed in through
 * the slots) and the Admin site (read-only view).
 *
 * Slots: `titleAction` (button in the points header), `photoOverlay` (inside
 * the photo frame), `aboutSlot` (replaces the bio/talent/hobbies block).
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
  const hobbies = student.hobbies || [];

  return (
    <div className="flex flex-col gap-4">
      <IdCardFront student={student} photoOverlay={photoOverlay} />

      <section className="st-card p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="st-title">Activity points</h3>
          {titleAction}
        </div>
        <div className="flex items-center gap-3">
          <PointsMeter total={totalPoints} target={targetPoints} />
          <span className="st-mono shrink-0 text-sm font-bold text-[var(--accent-text)]">
            {totalPoints}/{targetPoints}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {cleared ? (
            <span className="st-chip border border-[var(--ok)] text-[var(--ok)]">Cleared</span>
          ) : (
            <span className="st-muted text-xs">
              {Math.max(0, targetPoints - totalPoints)} points to go
            </span>
          )}
          {onShowBreakdown && (
            <button
              type="button"
              onClick={onShowBreakdown}
              className="st-mono text-xs font-bold text-[var(--accent-text)] hover:underline"
            >
              [ view breakdown ]
            </button>
          )}
        </div>
      </section>

      <section className="st-card p-5">
        <h3 className="st-title mb-3">About</h3>
        {aboutSlot ?? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="st-label">Bio</p>
              <p className="mt-1 whitespace-pre-line break-words text-sm">{student.bio || "—"}</p>
            </div>
            <div>
              <p className="st-label">Talent</p>
              <p className="mt-1 text-sm">{student.talent || "—"}</p>
            </div>
            <div>
              <p className="st-label">Hobbies</p>
              {hobbies.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {hobbies.map((h) => (
                    <span key={h} className="st-chip border border-[var(--line)] bg-[var(--card-2)]">
                      {h}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm">—</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
