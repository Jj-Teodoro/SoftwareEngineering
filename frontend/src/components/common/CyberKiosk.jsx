import { useEffect, useState } from "react";
import { FiAward, FiCalendar, FiCheckCircle, FiInfo, FiLock, FiLogOut, FiUsers, FiXCircle } from "react-icons/fi";
import { programTheme } from "./StudentIdCard.jsx";

/**
 * Student-facing check-in screen shared by the Admin and Scanner kiosks.
 * Purely presentational: the host passes the scan state and handlers.
 * It uses the student site's design (cards on a calm dark base, Inter for reading,
 * JetBrains Mono for short labels, the CSS variables and st- classes of index.css),
 * so the kiosk looks like the rest of OASIS. Always dark, whatever the browser theme.
 */

const RESULT_MS = 6000;
const CODES = { bsit: "BSIT", bscpe: "BSCpE", bscs: "BSCS" };
const READ = { fontFamily: "Inter, system-ui, sans-serif" };
const HEADLINE = { fontFamily: "Montserrat, Inter, sans-serif" };

const KEYFRAMES = `
@keyframes kx-pop { 0% { opacity: 0; transform: translateY(10px) scale(.97); } 100% { opacity: 1; transform: none; } }
@keyframes kx-drain { from { width: 100%; } to { width: 0%; } }
@keyframes kx-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes kx-pulse { 0%, 100% { opacity: .45; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .kx-anim { animation: none !important; } }
`;

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Backdrop({ children }) {
  return (
    <div className="relative min-h-dvh overflow-hidden text-[var(--text-primary)]" style={{ background: "var(--bg-base)", ...READ }}>
      <style>{KEYFRAMES}</style>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 12% 0%, var(--glow-a), transparent 70%), radial-gradient(ellipse 55% 40% at 100% 100%, var(--glow-b), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,.9),rgba(0,0,0,.1))]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}

// the same "window" the student login uses: three dots, a path, then the content
function Window({ path, right, className = "", children }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-[var(--shadow)] ${className}`}
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ background: "linear-gradient(90deg, var(--header-from), var(--header-to))" }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="st-mono ml-2 min-w-0 truncate whitespace-nowrap text-xs font-bold text-white/80">{path}</span>
        {right && <span className="ml-auto shrink-0 whitespace-nowrap">{right}</span>}
      </div>
      <div
        style={{
          backgroundImage:
            "linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

function Avatar({ student, color }) {
  const initials = (student.name || "?")
    .split(/[ ,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <div
      className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-2 bg-[var(--card-2)] text-3xl font-extrabold"
      style={{ borderColor: color }}
    >
      {student.photo ? (
        <img src={student.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="st-mono" style={{ color }}>
          {initials}
        </span>
      )}
    </div>
  );
}

const RESULT_THEME = {
  in: { color: "var(--ok)", label: "Access granted", sub: "Welcome! You're checked in.", Icon: FiCheckCircle },
  out: { color: "var(--gold)", label: "Checked out", sub: "Thank you! You're checked out.", Icon: FiLogOut },
  already: { color: "var(--series-b)", label: "Already done", sub: "You're already checked out.", Icon: FiInfo },
  error: { color: "var(--danger)", label: "Access denied", sub: "", Icon: FiXCircle },
};

function ResultCard({ result }) {
  const theme =
    result.type === "error" ? RESULT_THEME.error : RESULT_THEME[result.action] || RESULT_THEME.in;
  const { color, Icon } = theme;
  const program = result.student ? programTheme(result.student.course) : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div
        key={result.id}
        className="kx-anim relative max-h-full w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-3xl border-2 px-6 pb-8 pt-6 text-center shadow-[var(--shadow)]"
        style={{
          animation: "kx-pop .35s ease-out",
          borderColor: color,
          backgroundColor: "var(--card)",
          backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${color} 18%, transparent), transparent 65%)`,
        }}
      >
        <p className="st-mono flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-wide sm:text-2xl" style={{ color }}>
          <Icon size={24} /> {theme.label}
        </p>

        {result.student ? (
          <>
            <div className="mt-5">
              <Avatar student={result.student} color={color} />
            </div>
            <p className="mt-4 text-balance text-2xl font-extrabold leading-tight sm:text-3xl" style={HEADLINE}>
              {result.student.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {result.student.section && (
                <span className="st-mono text-sm text-[var(--text-muted)]">{result.student.section}</span>
              )}
              {program && CODES[program.key] && (
                <span className="st-chip text-[11px]" style={{ background: program.accent, color: program.ink }}>
                  {CODES[program.key]}
                </span>
              )}
            </div>

            <div className="st-inset mx-auto mt-5 max-w-[340px] space-y-1.5 px-4 py-3 text-base">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Time in</span>
                <span className="st-mono font-bold" style={{ color }}>
                  {formatTime(result.record.timeIn)}
                </span>
              </div>
              {result.record.timeOut && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Time out</span>
                  <span className="st-mono font-bold" style={{ color }}>
                    {formatTime(result.record.timeOut)}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-4 text-base text-[var(--text-primary)]">{theme.sub}</p>
          </>
        ) : (
          <p className="mt-5 text-xl font-bold leading-relaxed sm:text-2xl">{result.message}</p>
        )}

        {/* time left before the card clears */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div className="kx-anim h-full" style={{ background: color, animation: `kx-drain ${RESULT_MS}ms linear forwards` }} />
        </div>
      </div>
    </div>
  );
}

export function CyberKioskNotice({ title, message, buttonLabel, onExit, logoSrc }) {
  return (
    <Backdrop>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
        {logoSrc && <img src={logoSrc} alt="OASIS" className="h-auto max-w-[200px]" />}
        <Window path="oasis://kiosk/offline" className="w-full max-w-lg">
          <div className="px-8 py-10">
            <p className="st-mono text-xs font-bold uppercase tracking-wide text-[var(--danger)]">// session offline</p>
            <h2 className="mt-3 text-2xl font-extrabold leading-snug" style={HEADLINE}>
              {title}
            </h2>
            {message && <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--text-muted)]">{message}</p>}
            <div className="mt-8 flex justify-center">
              <button type="button" onClick={onExit} className="st-btn px-8">
                {buttonLabel}
              </button>
            </div>
          </div>
        </Window>
      </div>
    </Backdrop>
  );
}

export default function CyberKiosk({
  event,
  logoSrc,
  acesSrc,
  scanValue,
  onScanValueChange,
  onScan,
  inputRef,
  result,
  exit,
}) {
  const isRestricted = event.programFilter && event.programFilter !== "ALL";

  return (
    <Backdrop>
      <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        {logoSrc && (
          <img
            src={logoSrc}
            alt="OASIS Logo"
            className="mb-6 h-auto max-w-[220px] object-contain lg:max-w-[260px]"
          />
        )}

        <Window
          path="oasis://kiosk/check-in"
          className="w-full max-w-3xl"
          right={
            <span className="st-mono flex items-center gap-2 text-xs font-bold text-white/85">
              <span
                className="kx-anim h-2 w-2 rounded-full bg-[var(--danger)]"
                style={{ animation: "kx-pulse 2s ease-in-out infinite" }}
              />
              <span className="hidden sm:inline">LIVE ·</span> <Clock />
            </span>
          }
        >
          <div className="px-6 pb-10 pt-8 sm:px-12">
            <h1 className="text-center text-3xl font-extrabold leading-tight sm:text-5xl" style={HEADLINE}>
              {event.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="st-chip border text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--line)" }}>
                <FiCalendar size={13} /> {event.date}
              </span>
              <span className="st-chip bg-[var(--gold)] text-xs text-[var(--on-gold)]">
                <FiAward size={13} /> {event.pointValue} pts
              </span>
              <span className="st-chip border text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--line)" }}>
                <FiUsers size={13} /> {isRestricted ? event.programFilter : "All programs"}
              </span>
            </div>

            <div className="my-7 h-px" style={{ background: "var(--line)" }} aria-hidden="true" />

            <label
              htmlFor="kiosk-scan"
              className="st-mono mb-3 block text-center text-base font-bold text-[var(--accent-text)] sm:text-lg"
            >
              &gt; Tap / scan your student ID
            </label>
            <input
              id="kiosk-scan"
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={(e) => onScanValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onScan();
              }}
              placeholder="Student ID"
              className="st-input !h-20 !rounded-xl text-center !text-3xl tracking-widest sm:!h-24 sm:!text-4xl"
              autoFocus
              autoComplete="off"
            />
            <p className="st-mono mt-3 text-center text-xs text-[var(--text-faint)]">
              waiting for a student ID
              <span className="kx-anim" style={{ animation: "kx-blink 1s steps(1) infinite" }}>
                _
              </span>
            </p>
          </div>
        </Window>

        {result && <ResultCard result={result} />}

        {/* Officer exit */}
        <div className="mt-8">
          {!exit.show ? (
            <button
              type="button"
              onClick={exit.onOpen}
              className="st-mono flex items-center gap-2 text-xs text-[var(--text-faint)] transition-colors hover:text-[var(--accent-text)]"
            >
              <FiLock size={13} /> [ Officer exit ]
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border bg-[var(--card)] px-3 py-2.5" style={{ borderColor: "var(--line)" }}>
              <input
                type="password"
                value={exit.password}
                onChange={(e) => exit.onPasswordChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") exit.onSubmit();
                }}
                placeholder={exit.placeholder}
                autoFocus
                className="st-input !h-10 !w-48 !text-sm"
              />
              <button type="button" onClick={exit.onSubmit} disabled={exit.busy} className="st-btn !h-10 px-5 !text-xs">
                Exit
              </button>
              <button type="button" onClick={exit.onCancel} className="st-btn-ghost !h-10 px-4 !text-xs">
                Cancel
              </button>
            </div>
          )}
          {exit.error && <p className="st-mono mt-2 text-center text-xs font-bold text-[var(--danger)]">! {exit.error}</p>}
        </div>

        {acesSrc && <img src={acesSrc} alt="ACES Logo" className="mt-8 h-auto max-w-[72px] object-contain opacity-70" />}
      </div>
    </Backdrop>
  );
}
