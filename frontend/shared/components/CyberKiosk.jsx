import { useEffect, useState } from "react";
import { FiAward, FiCalendar, FiLock, FiUsers } from "react-icons/fi";

/**
 * Student-facing check-in screen shared by the Admin and Scanner kiosks.
 * Purely presentational: the host passes the scan state and handlers.
 * Self-contained styling (keyframes below) so it looks the same in both sites.
 */

const GOLD = "#f2b400";
const CYAN = "#05d9e8";
const PINK = "#ff2a6d";
const MINT = "#19f5b0";
const RESULT_MS = 6000;

const MONO = "font-['Share_Tech_Mono',ui-monospace,monospace]";
const DISPLAY = "font-['Krona_One','Montserrat',sans-serif]";

const poly = (c, s) =>
  `polygon(${c}px 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${s}px 100%, 0 calc(100% - ${s}px), 0 ${c}px)`;

const KEYFRAMES = `
@keyframes kx-sweep { 0% { transform: translateY(-20vh); } 100% { transform: translateY(120vh); } }
@keyframes kx-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes kx-pop { 0% { opacity: 0; transform: translateY(10px) scale(.97); } 100% { opacity: 1; transform: none; } }
@keyframes kx-drain { from { width: 100%; } to { width: 0%; } }
@keyframes kx-scan { 0% { left: -30%; } 100% { left: 100%; } }
@keyframes kx-flicker { 0%, 100% { opacity: 1; } 92% { opacity: 1; } 93% { opacity: .5; } 94% { opacity: 1; } 96% { opacity: .7; } }
@media (prefers-reduced-motion: reduce) { .kx-anim { animation: none !important; } }
`;

const GLITCH = {
  textShadow: `1.5px 0 rgba(255,42,109,.75), -1.5px 0 rgba(5,217,232,.65), 0 0 14px rgba(242,180,0,.5)`,
};

export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Backdrop({ children }) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#0b0203] text-white ${MONO}`}>
      <style>{KEYFRAMES}</style>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 15% 0%, rgba(151,25,29,.55), transparent 70%), radial-gradient(ellipse 55% 40% at 100% 100%, rgba(5,217,232,.14), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,.9),rgba(0,0,0,.15))]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,180,0,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(242,180,0,.07) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 1px, transparent 1px, transparent 4px)",
        }}
      />
      <div
        className="kx-anim pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-[#05d9e8] to-transparent opacity-[0.07]"
        style={{ animation: "kx-sweep 9s linear infinite" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,.5))]" />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}

function Frame({ children, color = GOLD, cut = 30, className = "", innerClassName = "" }) {
  const small = Math.round(cut / 2.6);
  return (
    <div className={className} style={{ filter: `drop-shadow(0 0 9px ${color}66)` }}>
      <div style={{ clipPath: poly(cut, small), background: color }} className="p-[2px]">
        <div
          className={`relative ${innerClassName}`}
          style={{
            clipPath: poly(cut - 2, small - 1),
            backgroundImage: `linear-gradient(rgba(242,180,0,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(242,180,0,.07) 1px, transparent 1px), linear-gradient(160deg, #3d0a0d 0%, #1f0506 55%, #120304 100%)`,
            backgroundSize: "18px 18px, 18px 18px, 100% 100%",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 1px, transparent 1px, transparent 3px)",
            }}
          />
          <div className="relative">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Slashes({ className = "", color = GOLD }) {
  return (
    <span className={`pointer-events-none absolute flex gap-1 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="h-3.5 w-1 -skew-x-[30deg]"
          style={{ background: color, opacity: 1 - i * 0.28 }}
        />
      ))}
    </span>
  );
}

function CyberButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${MONO} px-10 py-3 text-sm font-bold uppercase tracking-[3px] text-[#1a0405] transition-[filter,transform] hover:-translate-y-px hover:brightness-110 disabled:opacity-50`}
      style={{
        background: GOLD,
        clipPath:
          "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
      }}
    >
      {children}
    </button>
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
      className="mx-auto h-28 w-28 p-[2px]"
      style={{
        background: color,
        clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
        filter: `drop-shadow(0 0 8px ${color})`,
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center bg-[#2a0709] text-2xl font-bold"
        style={{
          clipPath:
            "polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)",
        }}
      >
        {student.photo ? (
          <img src={student.photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span style={{ color }}>{initials}</span>
        )}
      </div>
    </div>
  );
}

const RESULT_THEME = {
  in: { color: MINT, label: "Access granted", sub: "Welcome! You're checked in." },
  out: { color: GOLD, label: "Checked out", sub: "Thank you! You're checked out." },
  already: { color: CYAN, label: "Already done", sub: "You're already checked out." },
  error: { color: PINK, label: "Access denied", sub: "" },
};

function ResultCard({ result }) {
  const theme =
    result.type === "error" ? RESULT_THEME.error : RESULT_THEME[result.action] || RESULT_THEME.in;
  const { color } = theme;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
    <div
      key={result.id}
      className="kx-anim max-h-full w-full max-w-xl overflow-y-auto"
      style={{ animation: "kx-pop .35s ease-out", filter: `drop-shadow(0 0 16px ${color}99)` }}
    >
      <div
        className="p-[2px]"
        style={{ background: color, clipPath: poly(22, 8) }}
      >
        <div
          className="relative overflow-hidden px-6 pb-7 pt-6 text-center"
          style={{
            clipPath: poly(20, 7),
            backgroundColor: "#0c0304",
            backgroundImage: `linear-gradient(160deg, ${color}33, transparent 70%)`,
          }}
        >
          <p
            className={`${DISPLAY} text-base uppercase tracking-[4px] sm:text-xl`}
            style={{ color, textShadow: `0 0 12px ${color}` }}
          >
            {theme.label}
          </p>

          {result.student ? (
            <>
              <div className="mt-5">
                <Avatar student={result.student} color={color} />
              </div>
              <p className="mt-4 text-2xl font-bold uppercase tracking-[2px] text-white sm:text-4xl">
                {result.student.name}
              </p>
              <p className="mt-1 text-base uppercase tracking-[3px] text-white/60">
                {result.student.section}
              </p>

              <div className="mx-auto mt-5 max-w-[340px] space-y-1 border-y border-dashed border-white/20 py-3 text-base">
                <div className="flex justify-between uppercase tracking-[2px]">
                  <span className="text-white/60">Time in</span>
                  <span className="font-bold" style={{ color }}>
                    {formatTime(result.record.timeIn)}
                  </span>
                </div>
                {result.record.timeOut && (
                  <div className="flex justify-between uppercase tracking-[2px]">
                    <span className="text-white/60">Time out</span>
                    <span className="font-bold" style={{ color }}>
                      {formatTime(result.record.timeOut)}
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm uppercase tracking-[3px] text-white/80">{theme.sub}</p>
            </>
          ) : (
            <p className="mt-5 text-xl font-bold uppercase leading-relaxed tracking-[1px] text-white">
              {result.message}
            </p>
          )}

          {/* time left before the card clears */}
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
            <div
              className="kx-anim h-full"
              style={{
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: `kx-drain ${RESULT_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export function CyberKioskNotice({ title, message, buttonLabel, onExit, logoSrc }) {
  return (
    <Backdrop>
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        {logoSrc && <img src={logoSrc} alt="OASIS" className="h-auto max-w-[200px]" />}
        <Frame className="w-full max-w-lg" innerClassName="px-8 py-10">
          <p className="mb-3 text-[10px] uppercase tracking-[4px]" style={{ color: PINK }}>
            // session offline
          </p>
          <h2
            className={`${DISPLAY} text-lg uppercase leading-snug tracking-[3px]`}
            style={GLITCH}
          >
            {title}
          </h2>
          {message && (
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70">{message}</p>
          )}
          <div className="mt-8 flex justify-center">
            <CyberButton onClick={onExit}>{buttonLabel}</CyberButton>
          </div>
          <Slashes className="bottom-3 left-5" />
          <Slashes className="right-5 top-3" />
        </Frame>
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
      <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
        {logoSrc && (
          <img
            src={logoSrc}
            alt="OASIS Logo"
            className="mb-6 h-auto max-w-[260px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.5)] lg:max-w-[320px]"
          />
        )}

        <Frame className="w-full max-w-3xl" cut={40} innerClassName="px-6 pb-12 pt-9 sm:px-14">
          <div className="mb-4 flex items-center justify-between pr-14 text-xs uppercase tracking-[3px]">
            <span style={{ color: CYAN }}>// check-in terminal</span>
            <span className="flex items-center gap-1.5" style={{ color: GOLD }}>
              <span
                className="kx-anim h-1.5 w-1.5 rounded-full"
                style={{
                  background: PINK,
                  boxShadow: `0 0 6px ${PINK}`,
                  animation: "kx-flicker 3s linear infinite",
                }}
              />
              live · <Clock />
            </span>
          </div>

          <h1
            className={`${DISPLAY} text-center text-2xl uppercase leading-snug tracking-[3px] sm:text-4xl`}
            style={GLITCH}
          >
            {event.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm uppercase tracking-[2px]">
            <span className="flex items-center gap-1.5 border border-white/20 bg-black/30 px-4 py-1.5 text-white/80">
              <FiCalendar size={12} /> {event.date}
            </span>
            <span
              className="flex items-center gap-1.5 px-4 py-1.5 font-bold text-[#1a0405]"
              style={{
                background: GOLD,
                clipPath: "polygon(0 0, 100% 0, 100% 60%, 88% 100%, 0 100%)",
              }}
            >
              <FiAward size={12} /> {event.pointValue} pts
            </span>
            <span className="flex items-center gap-1.5 border border-white/20 bg-black/30 px-4 py-1.5 text-white/80">
              <FiUsers size={12} /> {isRestricted ? event.programFilter : "All programs"}
            </span>
          </div>

          <div className="my-6 flex items-center gap-1" aria-hidden="true">
            <span className="h-[2px] w-12" style={{ background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
            <span className="h-px flex-1 bg-[#f2b400]/30" />
            <span className="h-1.5 w-1.5 rotate-45" style={{ background: GOLD }} />
          </div>

          <label
            htmlFor="kiosk-scan"
            className="mb-4 block text-center text-sm font-bold uppercase tracking-[4px] sm:text-base"
            style={{ color: GOLD }}
          >
            &gt; Tap / scan your student ID
          </label>
          <div
            className="relative overflow-hidden border border-[#05d9e8]/60 bg-black/40 focus-within:border-[#05d9e8] focus-within:shadow-[0_0_18px_rgba(5,217,232,.35)]"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
            }}
          >
            <input
              id="kiosk-scan"
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={(e) => onScanValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onScan();
              }}
              placeholder="STUDENT ID"
              className={`${MONO} h-24 w-full bg-transparent px-5 text-center text-4xl uppercase tracking-[6px] text-white placeholder-white/25 outline-none`}
              autoFocus
              autoComplete="off"
            />
            <div
              className="kx-anim pointer-events-none absolute bottom-0 h-[2px] w-1/3"
              style={{
                background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
                boxShadow: `0 0 8px ${CYAN}`,
                animation: "kx-scan 2.4s linear infinite",
              }}
            />
          </div>
          <p className="mt-3 text-center text-xs uppercase tracking-[3px] text-white/40">
            waiting for input
            <span className="kx-anim" style={{ animation: "kx-blink 1s steps(1) infinite" }}>
              _
            </span>
          </p>

          <Slashes className="bottom-3 left-6" />
          <Slashes className="right-6 top-3.5" />
        </Frame>

        {result && <ResultCard result={result} />}

        {/* Officer exit */}
        <div className="mt-8">
          {!exit.show ? (
            <button
              type="button"
              onClick={exit.onOpen}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[3px] text-white/30 transition-colors hover:text-[#05d9e8]"
            >
              <FiLock size={12} /> [ Officer exit ]
            </button>
          ) : (
            <div className="flex items-center gap-2 border border-[#f2b400]/40 bg-black/50 px-4 py-2">
              <input
                type="password"
                value={exit.password}
                onChange={(e) => exit.onPasswordChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") exit.onSubmit();
                }}
                placeholder={exit.placeholder}
                autoFocus
                className={`${MONO} h-9 w-44 bg-transparent text-sm text-white placeholder-white/30 outline-none`}
              />
              <button
                type="button"
                onClick={exit.onSubmit}
                disabled={exit.busy}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-[2px] text-[#1a0405] transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: GOLD }}
              >
                Exit
              </button>
              <button
                type="button"
                onClick={exit.onCancel}
                className="text-xs uppercase tracking-[2px] text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
          {exit.error && (
            <p className="mt-2 text-center text-xs font-bold uppercase tracking-[1px]" style={{ color: PINK }}>
              ! {exit.error}
            </p>
          )}
        </div>

        {acesSrc && (
          <img
            src={acesSrc}
            alt="ACES Logo"
            className="mt-8 h-auto max-w-[72px] object-contain opacity-60"
          />
        )}
      </div>
    </Backdrop>
  );
}
