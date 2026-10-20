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

// The OASIS name is the star of the top banner; the school sits underneath it.
export default function AuthHero() {
  return (
    <div
      className="border-b-2 bg-gradient-to-b from-[var(--header-from)] to-[var(--header-to)] px-6 pb-16 pt-9 text-center text-white"
      style={{ borderColor: "var(--gold)" }}
    >
      <div className="st-rise">
        <div className="st-shine mx-auto w-fit">
          <img src={oasis_logo} alt="OASIS" className="mx-auto h-16 w-auto sm:h-20" />
        </div>
      </div>

      <div className="st-rise mx-auto mt-6 flex max-w-xs items-center justify-center gap-3 text-left" style={{ animationDelay: "0.15s" }}>
        <img src={aces_logo} alt="ACES" className="h-12 w-12 shrink-0 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-bold">Dr. Yanga's Colleges, Inc.</p>
          <p className="st-mono mt-0.5 text-[11px] text-[var(--gold)]">&lt;College of Computer Studies /&gt;</p>
        </div>
      </div>
    </div>
  );
}
