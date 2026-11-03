import { useEffect, useRef, useState } from "react";

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Fades its children in (and up) the first time they scroll into view.
export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(reducedMotion());

  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// True once the element has been on screen (used to start counters and one-shot animations).
export function useSeen(threshold = 0.4) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, seen];
}

// Counts from 0 up to `target` once `start` is true.
export function useCount(target, start, ms = 1400) {
  const [value, setValue] = useState(reducedMotion() ? target : 0);
  useEffect(() => {
    if (!start || reducedMotion()) {
      if (reducedMotion()) setValue(target);
      return undefined;
    }
    let frame;
    const t0 = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - t0) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, ms]);
  return value;
}

// Types a word, holds it, deletes it, then moves to the next one.
export function useTypewriter(words) {
  const [state, setState] = useState({ index: 0, text: reducedMotion() ? words[0] : "" });

  useEffect(() => {
    if (reducedMotion()) return undefined;
    let index = 0;
    let chars = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const word = words[index];
      if (!deleting) {
        chars += 1;
        setState({ index, text: word.slice(0, chars) });
        if (chars === word.length) {
          deleting = true;
          timer = setTimeout(tick, 1700);
          return;
        }
        timer = setTimeout(tick, 120);
      } else {
        chars -= 1;
        setState({ index, text: word.slice(0, chars) });
        if (chars === 0) {
          deleting = false;
          index = (index + 1) % words.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 55);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [words]);

  return state;
}

// Falling code characters, drawn on a canvas behind the hero. Paused when the tab is hidden.
export function CodeRain({ color = "242, 180, 0", className = "" }) {
  const canvas = useRef(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || reducedMotion()) return undefined;
    const ctx = el.getContext("2d");
    const glyphs = "01{}[]<>/;=+-*#$&%";
    const size = 16;
    let drops = [];
    let timer;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      el.width = el.clientWidth * ratio;
      el.height = el.clientHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.ceil(el.clientWidth / size) }, () => Math.random() * -40);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (document.hidden) return;
      ctx.fillStyle = "rgba(20, 6, 10, 0.14)";
      ctx.fillRect(0, 0, el.clientWidth, el.clientHeight);
      ctx.font = `${size}px "JetBrains Mono", monospace`;
      drops.forEach((y, i) => {
        const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillStyle = y > 0 && Math.random() > 0.96 ? "rgba(255,255,255,0.9)" : `rgba(${color}, 0.55)`;
        ctx.fillText(glyph, i * size, y * size);
        drops[i] = y * size > el.clientHeight && Math.random() > 0.975 ? Math.random() * -20 : y + 1;
      });
    };
    timer = setInterval(draw, 70);

    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return <canvas ref={canvas} className={`h-full w-full ${className}`} aria-hidden="true" />;
}
