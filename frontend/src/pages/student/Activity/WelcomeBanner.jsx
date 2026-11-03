import { useEffect, useState } from "react";
import { programTheme, splitName } from "../../../components/common/StudentIdCard.jsx";
import { usePoints } from "../../../context/student/PointsContext";

const CODES = { bsit: "BSIT", bscpe: "BSCpE", bscs: "BSCS", default: "CCS" };

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const titleCase = (text) =>
  text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// A ring that fills up to the student's progress when the page opens.
function Ring({ pct, total, target }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="relative h-[84px] w-[84px] shrink-0 sm:h-36 sm:w-36" role="img" aria-label={`${total} of ${target} points`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="st-mono text-lg font-extrabold leading-none text-white sm:text-3xl">{pct}%</span>
        <span className="st-mono mt-1 hidden text-[11px] font-bold text-white/70 sm:block">
          {total}/{target} pts
        </span>
      </div>
    </div>
  );
}

export default function WelcomeBanner({ student }) {
  const { totalPoints, targetPoints, cleared } = usePoints();
  const theme = programTheme(student.course);
  const { first } = splitName(student.name);
  const pct = targetPoints > 0 ? Math.min(100, Math.round((totalPoints / targetPoints) * 100)) : 0;
  const toGo = Math.max(0, targetPoints - totalPoints);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-4 text-white shadow-[var(--shadow)] sm:p-8"
      style={{
        borderColor: "var(--line)",
        backgroundImage: `linear-gradient(color-mix(in srgb, var(--gold) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--gold) 7%, transparent) 1px, transparent 1px), linear-gradient(120deg, ${theme.bg[0]}, ${theme.bg[2]})`,
        backgroundSize: "24px 24px, 24px 24px, 100% 100%",
      }}
    >
      <span
        className="st-mono pointer-events-none absolute -bottom-6 right-1 select-none text-[90px] font-extrabold leading-none text-white/[0.07] sm:text-[190px]"
        aria-hidden="true"
      >
        {CODES[theme.key]}
      </span>

      <div className="relative flex items-center justify-between gap-3 sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="st-mono text-[11px] font-bold text-[var(--gold)] sm:text-xs">// {greeting().toLowerCase()}</p>
          <h2 className="mt-1 truncate text-xl font-extrabold leading-tight sm:mt-2 sm:text-5xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
            Hi, {titleCase(first || student.name)}!
          </h2>
          <p className="mt-1 max-w-md truncate text-xs text-white/75 sm:mt-2 sm:text-sm">
            <span className="sm:hidden">
              {[CODES[theme.key], student.yearLevel, student.section].filter(Boolean).join(" · ")}
            </span>
            <span className="hidden sm:inline">
              {(student.course || "").replace(/^BS\s+/i, "Bachelor of Science in ")}
              {student.yearLevel ? ` · ${student.yearLevel}` : ""}
              {student.section ? ` · ${student.section}` : ""}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2 sm:mt-4">
            <span className="st-chip hidden bg-[var(--gold)] text-[var(--on-gold)] sm:inline-flex">{CODES[theme.key]}</span>
            {cleared ? (
              <span className="st-chip bg-[#3ddc97] text-[#06210f]">Cleared this semester</span>
            ) : (
              <span className="st-chip border border-white/25 text-white/90">{toGo} points to clearance</span>
            )}
          </div>
        </div>
        <Ring pct={pct} total={totalPoints} target={targetPoints} />
      </div>
    </section>
  );
}
