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
    <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36" role="img" aria-label={`${total} of ${target} points`}>
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
        <span className="st-mono text-3xl font-extrabold leading-none text-white">{pct}%</span>
        <span className="st-mono mt-1 text-[11px] font-bold text-white/70">
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
      className="relative overflow-hidden rounded-3xl border p-6 text-white shadow-[var(--shadow)] sm:p-8"
      style={{
        borderColor: "var(--line)",
        backgroundImage: `linear-gradient(color-mix(in srgb, var(--gold) 7%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--gold) 7%, transparent) 1px, transparent 1px), linear-gradient(120deg, ${theme.bg[0]}, ${theme.bg[2]})`,
        backgroundSize: "24px 24px, 24px 24px, 100% 100%",
      }}
    >
      <span
        className="st-mono pointer-events-none absolute -bottom-8 right-2 select-none text-[130px] font-extrabold leading-none text-white/[0.07] sm:text-[190px]"
        aria-hidden="true"
      >
        {CODES[theme.key]}
      </span>

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="st-mono text-xs font-bold text-[var(--gold)]">// {greeting().toLowerCase()}</p>
          <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
            Hi, {titleCase(first || student.name)}!
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/75">
            {(student.course || "").replace(/^BS\s+/i, "Bachelor of Science in ")}
            {student.yearLevel ? ` · ${student.yearLevel}` : ""}
            {student.section ? ` · ${student.section}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="st-chip bg-[var(--gold)] text-[var(--on-gold)]">{CODES[theme.key]}</span>
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
