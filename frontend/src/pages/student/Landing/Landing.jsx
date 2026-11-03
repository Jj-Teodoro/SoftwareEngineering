import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiAward, FiCamera, FiCheckCircle } from "react-icons/fi";
import aces_logo from "../../../assets/aceslogo.png";
import oasis_logo from "../../../assets/oasis-logo.png";
import { PROGRAMS, ProgramScene } from "./scenes";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const STEPS = [
  { Icon: FiCheckCircle, title: "Join events", text: "Your college posts events and requirements. See the ones meant for your program." },
  { Icon: FiCamera, title: "Scan your ID", text: "At the door, your ID's barcode or QR code is scanned. No forms, no waiting." },
  { Icon: FiAward, title: "Earn points", text: "Points add up toward your semester clearance, and you can track them any time." },
];

const NAV = [
  { href: "#top", label: "Home" },
  { href: "#programs", label: "Programs" },
  { href: "#how", label: "How it works" },
];

function goToLogin() {
  window.location.hash = "login";
}

// Cursor-driven front page. The hero follows the pointer (parallax and a little 3D tilt),
// and a switcher for BSIT, BSCpE and BSCS changes the whole scene and its colour.
export default function Landing() {
  const [programId, setProgramId] = useState(PROGRAMS[0].id);
  const [interactive, setInteractive] = useState(() => !reducedMotion());
  const [picked, setPicked] = useState(false); // the visitor chose a program, so stop auto-rotating
  const hero = useRef(null);
  const program = PROGRAMS.find((p) => p.id === programId);

  // rotate through the programs until the visitor picks one
  useEffect(() => {
    if (!interactive || picked) return undefined;
    const timer = setInterval(() => {
      setProgramId((current) => PROGRAMS[(PROGRAMS.findIndex((p) => p.id === current) + 1) % PROGRAMS.length].id);
    }, 7000);
    return () => clearInterval(timer);
  }, [interactive, picked]);

  // the pointer sets two CSS variables; every layer reads them (no React re-render per move)
  const onMove = (event) => {
    if (!interactive || !hero.current) return;
    const box = hero.current.getBoundingClientRect();
    hero.current.style.setProperty("--px", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    hero.current.style.setProperty("--py", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  };
  const onLeave = () => {
    hero.current?.style.setProperty("--px", "0");
    hero.current?.style.setProperty("--py", "0");
  };
  useEffect(() => {
    if (!interactive) onLeave();
  }, [interactive]);

  const choose = (id) => {
    setProgramId(id);
    setPicked(true);
  };
  const showProgram = (id) => {
    choose(id);
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="st-root min-h-dvh scroll-smooth bg-[#14060a] text-white">
      {/* ------------------------------------------------------------ hero */}
      <section
        id="top"
        ref={hero}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="relative isolate flex h-dvh min-h-[700px] flex-col overflow-hidden"
        style={{ "--accent": program.accent, "--px": 0, "--py": 0 }}
      >
        {/* backdrop: one tinted layer per program, cross-faded */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#3a0a0d] to-[#14060a]" />
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            className={`absolute inset-0 -z-10 transition-opacity duration-700 ${p.id === programId ? "opacity-100" : "opacity-0"}`}
            style={{
              background: `radial-gradient(60% 55% at 50% 58%, ${p.accent}55, transparent 70%), radial-gradient(40% 40% at 90% 10%, ${p.accent}22, transparent 70%)`,
            }}
            aria-hidden="true"
          />
        ))}

        {/* giant outlined program name, drifting behind everything */}
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            className={`pointer-events-none absolute inset-x-0 top-[30%] -z-[5] overflow-hidden transition-opacity duration-700 ${
              p.id === programId ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            <div
              className={`flex w-max whitespace-nowrap text-[17vw] font-extrabold leading-none sm:text-[13vw] ${interactive ? "st-marquee" : ""}`}
              style={{
                fontFamily: "Montserrat, Inter, sans-serif",
                color: "transparent",
                WebkitTextStroke: "2px rgba(255,255,255,0.16)",
              }}
            >
              <span className="pr-[4vw]">{p.ghost}</span>
              <span className="pr-[4vw]">{p.ghost}</span>
              <span className="pr-[4vw]">{p.ghost}</span>
              <span className="pr-[4vw]">{p.ghost}</span>
            </div>
          </div>
        ))}

        <header className="relative z-30 flex items-center justify-between px-5 pt-5 sm:px-10 sm:pt-7">
          <div className="flex items-center gap-3">
            <img src={oasis_logo} alt="OASIS" className="h-9 w-auto sm:h-11" />
            <span className="hidden h-6 w-px bg-white/30 sm:block" aria-hidden="true" />
            <img src={aces_logo} alt="ACES" className="hidden h-10 w-10 object-contain sm:block" />
          </div>
          <button type="button" onClick={goToLogin} className="st-btn h-11 px-5 text-xs sm:px-7">
            Log in <FiArrowRight />
          </button>
        </header>

        <div className="relative z-20 mt-5 px-5 text-center sm:mt-8">
          <p className="st-mono text-xs font-bold tracking-wide text-[var(--accent)] transition-colors duration-500 sm:text-sm">
            &lt;College of Computer Studies /&gt;
          </p>
          <h1
            className="mx-auto mt-2 max-w-3xl text-[26px] font-extrabold leading-[1.1] sm:text-5xl"
            style={{ fontFamily: "Montserrat, Inter, sans-serif" }}
          >
            One system for <span className="text-[var(--accent)] transition-colors duration-500">BSIT</span>,{" "}
            <span className="text-[var(--accent)] transition-colors duration-500">BSCpE</span> and{" "}
            <span className="text-[var(--accent)] transition-colors duration-500">BSCS</span>
          </h1>
          <p key={program.id} className="st-fade mx-auto mt-3 max-w-xl text-sm text-white/75 sm:text-base">
            {program.headline}
          </p>
        </div>

        {/* the scene */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-3">
          <div className="relative" style={{ height: "min(100%, 470px)", aspectRatio: "10 / 9", maxWidth: "100%" }}>
            {PROGRAMS.map((p) => (
              <ProgramScene key={p.id} program={p} active={p.id === programId} motion={interactive} />
            ))}
          </div>
        </div>

        {/* program switcher */}
        <div className="relative z-30 pb-6 sm:pb-8">
          <div role="tablist" aria-label="Programs" className="mx-auto flex w-fit max-w-full gap-1.5 rounded-2xl border border-white/15 bg-black/35 p-1.5 backdrop-blur">
            {PROGRAMS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === programId}
                onClick={() => choose(p.id)}
                className={`st-mono rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition sm:px-6 ${
                  p.id === programId ? "text-[#14060a]" : "text-white/75 hover:text-white"
                }`}
                style={p.id === programId ? { background: p.accent } : undefined}
              >
                {p.code}
              </button>
            ))}
          </div>
        </div>

        {/* side menu and the interactive-mode switch, like a portfolio site */}
        <nav className="absolute bottom-8 left-8 z-30 hidden text-sm text-white/70 md:block" aria-label="Sections">
          <ul className="space-y-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition hover:text-[var(--accent)]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            role="switch"
            aria-checked={interactive}
            onClick={() => setInteractive((v) => !v)}
            className="mt-4 flex items-center gap-2 text-xs"
          >
            <span>Interactive mode</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${interactive ? "bg-[var(--accent)]" : "bg-white/25"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${interactive ? "left-[18px]" : "left-0.5"}`} />
            </span>
          </button>
        </nav>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-10">
        <p className="st-mono text-xs font-bold text-[#f2b400]">// how it works</p>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
          Attend. Scan. Get cleared.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1.5 hover:border-[#f2b400]/60 hover:bg-white/[0.07]"
            >
              <span className="st-mono absolute right-5 top-4 text-4xl font-extrabold text-white/10">0{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2b400] text-[#2a0507]">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ programs */}
      <section id="programs" className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-10">
        <p className="st-mono text-xs font-bold text-[#f2b400]">// your program</p>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
          Three programs, one place
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PROGRAMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => showProgram(p.id)}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-left transition duration-300 hover:-translate-y-1.5 hover:bg-white/[0.07]"
              style={{ "--accent": p.accent }}
            >
              <span className="st-mono text-3xl font-extrabold" style={{ color: p.accent }}>
                {p.code}
              </span>
              <h3 className="mt-1 text-lg font-bold">{p.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{p.blurb}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.topics.map((topic) => (
                  <span key={topic} className="st-chip border border-white/15 text-white/75">
                    {topic}
                  </span>
                ))}
              </div>
              <span className="st-mono mt-5 inline-flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-3" style={{ color: p.accent }}>
                See the scene <FiArrowRight />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ call to action */}
      <section className="px-5 pb-24 sm:px-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#f2b400] px-6 py-12 text-center text-[#2a0507] sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-4xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
            Ready to see your points?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm font-medium opacity-80">
            Log in with your student number. Your admin gives you a temporary password the first time.
          </p>
          <button
            type="button"
            onClick={goToLogin}
            className="st-mono mt-7 inline-flex h-12 items-center gap-2 rounded-lg bg-[#2a0507] px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-125"
          >
            Student log in <FiArrowRight />
          </button>
        </div>
        <p className="st-mono mt-8 text-center text-[11px] text-white/40">
          Dr. Yanga's Colleges, Inc. &middot; College of Computer Studies &middot; ACES
        </p>
      </section>
    </div>
  );
}
