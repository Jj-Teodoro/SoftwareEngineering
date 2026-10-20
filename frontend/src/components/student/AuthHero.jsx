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

const pad2 = (n) => String(n).padStart(2, "0");

// Photo showcase: the whole photo is always visible (a blurred copy fills the frame behind it),
// with arrows, a counter, autoplay that pauses on hover, and two photos peeking out behind.
function PhotoShowcase() {
  const count = COVERS.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (delta) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    if (reducedMotion() || paused || count < 2) return undefined;
    const timer = setTimeout(() => go(1), 4200);
    return () => clearTimeout(timer);
  }, [index, paused, count]);

  useEffect(() => {
    if (count > 1) new Image().src = COVERS[(index + 2) % count];
  }, [index, count]);

  if (count === 0) return null;
  const at = (offset) => COVERS[(index + offset + count) % count];
  const arrow =
    "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-lg font-bold text-white backdrop-blur transition hover:bg-[#f2b400] hover:text-[#2a0507] sm:h-10 sm:w-10";

  return (
    <div
      className="relative mx-auto w-full max-w-[280px] sm:max-w-[460px] lg:mx-0 lg:max-w-[500px] xl:max-w-[580px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* the next photos peek out behind the frame */}
      <img
        src={at(2)}
        alt=""
        className="absolute -left-3 top-3 hidden aspect-[3/2] w-[88%] -rotate-6 rounded-xl border-4 border-white/70 object-cover opacity-60 sm:block"
        aria-hidden="true"
      />
      <img
        src={at(1)}
        alt=""
        className="absolute -right-3 top-2 hidden aspect-[3/2] w-[88%] rotate-6 rounded-xl border-4 border-white/70 object-cover opacity-70 sm:block"
        aria-hidden="true"
      />

      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border-[5px] border-white bg-[#1c0507] shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
        <img
          key={`bg-${index}`}
          src={at(0)}
          alt=""
          className="st-fade absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-xl"
          aria-hidden="true"
        />
        <img key={index} src={at(0)} alt="OASIS event photo" className="st-fade absolute inset-0 h-full w-full object-contain" />

        <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${arrow} left-2`}>
          &lsaquo;
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${arrow} right-2`}>
          &rsaquo;
        </button>
        <span className="st-mono absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white">
          {pad2(index + 1)} / {pad2(count)}
        </span>
      </div>
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
          className="st-rise text-[30px] font-extrabold uppercase leading-[1.1] tracking-tight sm:text-[36px] lg:text-[50px] xl:text-[58px]"
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

      {/* photo showcase + call-to-action badge */}
      <div className="relative mt-7 lg:mt-8">
        <PhotoShowcase />
        <button
          type="button"
          onClick={focusLogin}
          aria-label="Go to the log in form"
          className="st-mono absolute -bottom-5 right-0 flex h-[68px] w-[68px] -rotate-12 flex-col items-center justify-center rounded-full bg-[#f2b400] text-center text-[10px] font-extrabold uppercase leading-tight text-[#2a0507] shadow-lg transition hover:scale-105 sm:h-[84px] sm:w-[84px] sm:text-xs lg:right-auto lg:left-[440px] xl:left-[520px] lg:h-[96px] lg:w-[96px] lg:text-sm"
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
