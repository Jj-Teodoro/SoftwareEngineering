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

// Event photos that crossfade behind the banner. Only the current and previous photo are in the
// page, and the next one is fetched ahead of time, so the login screen stays light.
const COVERS = Object.entries(
  import.meta.glob("../../assets/cover/*.jpg", { eager: true, query: "?url", import: "default" })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);
const SLIDE_MS = 4200;

function CoverSlideshow() {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    if (reducedMotion() || COVERS.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => {
        setPrevious(current);
        return (current + 1) % COVERS.length;
      });
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (COVERS.length > 1) new Image().src = COVERS[(index + 1) % COVERS.length];
  }, [index]);

  if (COVERS.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {previous !== null && <img src={COVERS[previous]} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <img key={index} src={COVERS[index]} alt="" className="st-cover absolute inset-0 h-full w-full object-cover" />
      {/* maroon wash so the logo and text stay readable over any photo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(58,8,11,0.82) 0%, rgba(42,6,9,0.6) 45%, rgba(30,4,6,0.86) 100%)",
        }}
      />
    </div>
  );
}

const PERKS = ["see your activity points", "check upcoming events", "get event notifications"];

// The OASIS name leads the banner and the school sits underneath it.
// Phones: a banner across the top. Computers: the left half of the screen.
function AuthHero() {
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden border-b-2 px-6 pb-16 pt-9 text-center text-white lg:min-h-dvh lg:border-b-0 lg:border-r-2 lg:px-12 lg:pb-9"
      style={{
        borderColor: "var(--gold)",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(180deg, var(--header-from), var(--header-to))",
        backgroundSize: "32px 32px, 32px 32px, 100% 100%",
      }}
    >
      <CoverSlideshow />
      <div className="st-rise relative">
        <img src={oasis_logo} alt="OASIS" className="mx-auto h-16 w-auto sm:h-20 lg:h-28" />
      </div>

      <div
        className="st-rise relative mx-auto mt-6 flex max-w-xs items-center justify-center gap-3 text-left lg:mt-10"
        style={{ animationDelay: "0.15s" }}
      >
        <img src={aces_logo} alt="ACES" className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14" />
        <div className="leading-tight">
          <p className="text-sm font-bold lg:text-base">Dr. Yanga's Colleges, Inc.</p>
          <p className="st-mono mt-0.5 text-[11px] text-[var(--gold)] lg:text-xs">&lt;College of Computer Studies /&gt;</p>
        </div>
      </div>

      <ul
        className="st-rise st-mono relative mt-10 hidden space-y-2 text-left text-sm text-white/80 lg:block"
        style={{ animationDelay: "0.3s" }}
      >
        {PERKS.map((perk) => (
          <li key={perk}>
            <span className="text-[var(--gold)]">&gt;</span> {perk}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Page frame for the login screens: hero on one side, a form card on the other.
// The form side has its own tone so the card never blends into the page.
export function AuthShell({ children }) {
  return (
    <div className="st-root min-h-dvh bg-[var(--login-bg)] text-[var(--text-primary)] lg:grid lg:grid-cols-[1fr_1fr]">
      <AuthHero />
      <div className="relative -mt-10 flex justify-center px-4 pb-10 lg:mt-0 lg:items-center lg:py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

export default AuthHero;
