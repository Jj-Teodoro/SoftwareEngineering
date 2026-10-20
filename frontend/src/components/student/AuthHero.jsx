import { useEffect, useState } from "react";
import aces_logo from "../../assets/aceslogo.png";
import oasis_logo from "../../assets/oasis-logo.png";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Types a few short lines one after another, then erases and loops. Purely decorative.
export function TypedLines({ lines, className = "" }) {
  const [text, setText] = useState(() => (reducedMotion() ? lines[0] : ""));

  useEffect(() => {
    if (reducedMotion()) return undefined;
    let line = 0;
    let chars = 0;
    let erasing = false;
    let timer;

    const tick = () => {
      const current = lines[line];
      if (!erasing) {
        chars += 1;
        setText(current.slice(0, chars));
        if (chars === current.length) {
          erasing = true;
          timer = setTimeout(tick, 1500);
          return;
        }
        timer = setTimeout(tick, 42);
      } else {
        chars -= 2;
        if (chars <= 0) {
          chars = 0;
          erasing = false;
          line = (line + 1) % lines.length;
          setText("");
          timer = setTimeout(tick, 350);
          return;
        }
        setText(current.slice(0, chars));
        timer = setTimeout(tick, 18);
      }
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [lines]);

  return (
    <p className={`st-mono min-h-[1.5em] text-xs ${className}`} aria-hidden="true">
      {text}
      <span className="st-caret" />
    </p>
  );
}

// ---------------------------------------------------------------- photo shapes
const COVERS = Object.entries(
  import.meta.glob("../../assets/cover/*.jpg", { eager: true, query: "?url", import: "default" })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);
const STEP = 3; // coprime with 16, so each shape walks through every photo

// One photo that changes by itself with a quick flash. Only the current and previous
// photo are in the page, and the next one is fetched ahead of time.
function PhotoLoop({ offset = 0, every = 3800, className = "" }) {
  const count = COVERS.length;
  const [pair, setPair] = useState({ cur: count ? offset % count : 0, prev: null });

  useEffect(() => {
    if (reducedMotion() || count < 2) return undefined;
    const timer = setInterval(
      () => setPair((p) => ({ cur: (p.cur + STEP) % count, prev: p.cur })),
      every
    );
    return () => clearInterval(timer);
  }, [count, every]);

  useEffect(() => {
    if (count > 1) new Image().src = COVERS[(pair.cur + STEP) % count];
  }, [pair.cur, count]);

  if (count === 0) return <div className={className} />;
  return (
    <div className={`overflow-hidden bg-[#3a0a0d] ${className}`}>
      {pair.prev !== null && (
        <img src={COVERS[pair.prev]} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <img
        key={pair.cur}
        src={COVERS[pair.cur]}
        alt=""
        className="st-tile absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

const DOTS = {
  backgroundImage: "radial-gradient(circle, currentColor 1.6px, transparent 2.2px)",
  backgroundSize: "14px 14px",
};

function Dots({ className = "" }) {
  return <span className={`pointer-events-none absolute ${className}`} style={DOTS} aria-hidden="true" />;
}

// Bold, poster-style left side: big headline and photos cut into a circle, an arch and a dot.
function Poster() {
  const focusLogin = () => document.getElementById("studentNumber")?.focus();

  return (
    <div className="relative flex flex-col overflow-hidden rounded-b-[40px] bg-gradient-to-br from-[var(--header-from)] to-[#2a0709] px-6 pb-12 pt-7 text-white lg:min-h-dvh lg:justify-between lg:rounded-b-none lg:rounded-r-[64px] lg:px-12 lg:pb-12 lg:pt-10 xl:px-14">
      {/* background shapes */}
      <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-2 border-[#f2b400]/35" aria-hidden="true" />
      <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border-2 border-[#f2b400]/25" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-black/20" aria-hidden="true" />
      <Dots className="right-6 top-40 h-16 w-24 text-white/25 lg:right-12 lg:top-56 lg:h-24 lg:w-36" />
      <Dots className="bottom-6 right-6 hidden h-20 w-28 text-[#f2b400]/40 lg:block" />

      {/* top row */}
      <div className="relative flex items-center gap-3">
        <img src={oasis_logo} alt="OASIS" className="h-9 w-auto lg:h-12" />
        <span className="h-6 w-px bg-white/30" aria-hidden="true" />
        <img src={aces_logo} alt="ACES" className="h-9 w-9 shrink-0 object-contain lg:h-11 lg:w-11" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[11px] font-bold lg:text-sm">Dr. Yanga's Colleges, Inc.</p>
          <p className="st-mono truncate text-[10px] text-[#f2b400] lg:text-xs">&lt;College of Computer Studies /&gt;</p>
        </div>
      </div>

      {/* headline */}
      <div className="relative mt-6 lg:mt-8">
        <p className="st-mono mb-2 text-xs font-bold tracking-widest text-[#f2b400]">&#9654;&#9654;&#9654;</p>
        <h1
          className="st-rise text-[30px] font-extrabold uppercase leading-[1.1] tracking-tight sm:text-4xl lg:text-[50px] xl:text-[58px]"
          style={{ fontFamily: "Montserrat, Inter, sans-serif" }}
        >
          Earn points.
          <br />
          <span className="text-[#f2b400]">Join events.</span>
          <br />
          Get cleared.
        </h1>
        <p className="st-mono mt-3 max-w-sm text-xs text-white/75 lg:mt-5 lg:text-sm">
          // your ACES activity card, all in one place
        </p>
      </div>

      {/* photo shapes */}
      <div className="relative mt-6 h-[150px] w-full max-w-[540px] sm:h-[200px] lg:mt-8 lg:h-[270px] xl:mt-10 xl:h-[340px]">
        <PhotoLoop
          offset={0}
          every={3600}
          className="absolute right-0 top-0 h-[136px] w-[136px] rounded-full border-[5px] border-[#f2b400] sm:h-[190px] sm:w-[190px] lg:h-[230px] lg:w-[230px] lg:border-[6px] xl:h-[290px] xl:w-[290px] xl:border-[7px]"
        />
        <PhotoLoop
          offset={5}
          every={4400}
          className="absolute bottom-0 left-0 h-[130px] w-[88px] rounded-b-[18px] rounded-t-full border-[4px] border-white sm:h-[180px] sm:w-[120px] lg:h-[210px] lg:w-[142px] lg:rounded-b-[24px] lg:border-[5px] xl:h-[260px] xl:w-[176px] xl:rounded-b-[28px]"
        />
        <PhotoLoop
          offset={11}
          every={5200}
          className="absolute left-[78px] top-0 h-[56px] w-[56px] rounded-full border-[3px] border-[#f2b400] sm:left-[104px] sm:h-[78px] sm:w-[78px] lg:left-[118px] lg:h-[90px] lg:w-[90px] lg:border-4 xl:left-[150px] xl:h-[112px] xl:w-[112px]"
        />
        <button
          type="button"
          onClick={focusLogin}
          aria-label="Go to the log in form"
          className="st-mono absolute bottom-1 right-[92px] flex h-[64px] w-[64px] -rotate-12 flex-col items-center justify-center rounded-full bg-[#f2b400] text-center text-[10px] font-extrabold uppercase leading-tight text-[#2a0507] shadow-lg transition hover:scale-105 sm:right-[150px] sm:h-[84px] sm:w-[84px] sm:text-xs lg:bottom-3 lg:right-[160px] lg:h-[96px] lg:w-[96px] lg:text-sm xl:right-[200px] xl:h-[108px] xl:w-[108px]"
        >
          Log in
          <span aria-hidden="true">now &rarr;</span>
        </button>
      </div>
    </div>
  );
}

// Page frame for the login screens: bold poster on one side, a gold panel with the form card on the other.
export function AuthShell({ children }) {
  return (
    <div className="st-root min-h-dvh bg-[#f2b400] text-[var(--text-primary)] lg:grid lg:grid-cols-[1.15fr_1fr]">
      <Poster />
      <div className="relative -mt-6 flex justify-center overflow-hidden px-4 pb-10 pt-0 lg:mt-0 lg:items-center lg:py-12">
        <span className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#2a0709]/10" aria-hidden="true" />
        <span className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full border-2 border-[#2a0709]/20" aria-hidden="true" />
        <Dots className="right-6 top-8 hidden h-20 w-28 text-[#2a0709]/30 lg:block" />
        <Dots className="bottom-8 left-8 hidden h-16 w-24 text-[#2a0709]/30 lg:block" />
        <div className="relative w-full max-w-md pt-8 lg:pt-0">
          <div className="rounded-xl shadow-[0_24px_50px_rgba(42,7,9,0.45)]">{children}</div>
          <p className="st-mono mt-4 hidden text-center text-[11px] font-bold text-[#2a0709]/70 lg:block">
            ACES &middot; College of Computer Studies
          </p>
        </div>
      </div>
    </div>
  );
}
