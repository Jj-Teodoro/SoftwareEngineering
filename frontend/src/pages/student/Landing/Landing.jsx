import { FiArrowDown, FiArrowRight, FiAward, FiCalendar, FiCheck } from "react-icons/fi";
import aces_logo from "../../../assets/aceslogo.png";
import oasis_logo from "../../../assets/oasis-logo.png";
import { CodeRain, Reveal, reducedMotion, useCount, useSeen, useTypewriter } from "./effects";
import { PROGRAMS, SCENES } from "./ProgramScenes";

const COVERS = Object.entries(
  import.meta.glob("../../../assets/cover/*.jpg", { eager: true, query: "?url", import: "default" })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);

const WORDS = PROGRAMS.map((p) => p.code);
const ACCENT = Object.fromEntries(PROGRAMS.map((p) => [p.code, p.accent]));
const TICKER = ["EVENTS", "SCAN YOUR ID", "EARN POINTS", "GET CLEARED", "BSIT", "BSCpE", "BSCS", "NO PAPER FORMS"];

const goToLogin = () => {
  window.location.hash = "login";
};

// ----------------------------------------------------------------- pieces
function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-black/30 py-3" aria-hidden="true">
      <div className={`flex w-max gap-10 whitespace-nowrap ${reducedMotion() ? "" : "st-marquee"}`} style={{ animationDuration: "40s" }}>
        {[...items, ...items].map((word, i) => (
          <span key={i} className="st-mono flex items-center gap-10 text-sm font-bold tracking-widest text-white/70">
            {word}
            <span className="text-[#f2b400]">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Two rows of event photos drifting in opposite directions. Photos are cropped to fill their boxes.
function PhotoReel() {
  if (COVERS.length === 0) return null;
  const half = Math.ceil(COVERS.length / 2);
  const rows = [COVERS.slice(0, half), COVERS.slice(half)];
  return (
    <div className="space-y-4 overflow-hidden py-2" aria-label="Photos from college events">
      {rows.map((row, r) => {
        const strip = [...row, ...row];
        return (
          <div key={r} className="overflow-hidden">
            <div
              className={`flex w-max gap-4 ${reducedMotion() ? "" : r === 0 ? "st-marquee" : "st-marquee-rev"}`}
              style={{ animationDuration: r === 0 ? "70s" : "85s" }}
            >
              {[...strip, ...strip].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className={`h-36 w-56 shrink-0 rounded-2xl border-2 border-white/15 object-cover shadow-xl sm:h-48 sm:w-72 ${
                    (i + r) % 2 ? "-rotate-2" : "rotate-2"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgramCard({ program, delay }) {
  const Scene = SCENES[program.id];
  return (
    <Reveal delay={delay}>
      <div
        className="group h-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)]"
        style={{ "--accent": program.accent }}
      >
        <div className="aspect-[7/5] overflow-hidden rounded-2xl bg-black/30">
          <Scene accent={program.accent} />
        </div>
        <p className="st-mono mt-5 text-3xl font-extrabold" style={{ color: program.accent }}>
          {program.code}
        </p>
        <p className="mt-0.5 text-lg font-bold">{program.tagline}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{program.name}</p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{program.blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {program.topics.map((topic) => (
            <span key={topic} className="st-chip border border-white/15 text-white/75">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

// Step 1: event tickets slide into place one after another.
function EventsVisual() {
  const events = ["Orientation Day", "Hackathon Night", "General Assembly"];
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 px-4">
      {events.map((title, i) => (
        <div
          key={title}
          className="st-slide flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5"
          style={{ animationDelay: `${i * 0.6}s` }}
        >
          <FiCalendar className="shrink-0 text-[#f2b400]" />
          <span className="flex-1 truncate text-sm font-semibold">{title}</span>
          <span className="st-chip bg-[#f2b400] text-[#2a0507]">+{10 + i * 5}</span>
        </div>
      ))}
    </div>
  );
}

// Step 2: an ID card with a barcode and a scanner beam sweeping over it.
function ScanVisual() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative w-[78%] overflow-hidden rounded-xl border-2 border-[#f2b400] bg-gradient-to-br from-[#5a0e12] to-[#2a0709] p-3">
        <div className="flex items-center gap-3">
          <span className="h-12 w-10 rounded-md border-2 border-white bg-[#8c1a1f]" />
          <div className="flex-1 space-y-1.5">
            <span className="block h-2.5 w-3/4 rounded bg-white/80" />
            <span className="block h-2 w-1/2 rounded bg-[#f2b400]" />
          </div>
        </div>
        <div
          className="mt-3 h-7 rounded bg-[#fff8ea]"
          style={{ backgroundImage: "repeating-linear-gradient(90deg,#1a0a0b 0 2px,transparent 2px 5px,#1a0a0b 5px 6px,transparent 6px 10px)" }}
        />
        <span className="st-scan pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[#4fe3a0] shadow-[0_0_14px_3px_rgba(79,227,160,0.8)]" />
        <span className="st-pop st-mono absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-[#3ddc97] px-2 py-1 text-[10px] font-bold text-[#06210f]">
          <FiCheck /> CHECKED IN
        </span>
      </div>
    </div>
  );
}

// Step 3: the points bar fills and the number counts up when it scrolls into view.
function PointsVisual() {
  const [ref, seen] = useSeen();
  const points = useCount(65, seen, 1800);
  const filled = seen || reducedMotion();
  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-3 px-6">
      <div className="flex items-end justify-between">
        <span className="st-mono text-4xl font-extrabold text-[#f2b400]">{points}</span>
        <span className="st-mono text-sm text-white/50">/ 65 pts</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#f2b400] to-[#ffd75e]"
          style={{ width: filled ? "100%" : "0%", transition: "width 1.8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </div>
      <span
        className="st-chip w-fit self-end bg-[#3ddc97] text-[#06210f] transition-all duration-500"
        style={{ opacity: points >= 65 ? 1 : 0, transform: points >= 65 ? "scale(1)" : "scale(.7)" }}
      >
        <FiAward /> CLEARED
      </span>
    </div>
  );
}

const STEPS = [
  { title: "Events pop up", text: "Your college posts events and requirements. See the ones meant for your program.", Visual: EventsVisual },
  { title: "Scan your ID", text: "At the door, your ID's barcode or QR code is scanned. No forms, no waiting.", Visual: ScanVisual },
  { title: "Points add up", text: "Every event and requirement adds points toward your semester clearance.", Visual: PointsVisual },
];

// ----------------------------------------------------------------- page
export default function Landing() {
  const { index, text } = useTypewriter(WORDS);
  const word = WORDS[index];
  const accent = ACCENT[word];

  return (
    <div className="st-root min-h-dvh scroll-smooth bg-[#14060a] text-white">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#3a0a0d] via-[#1d070b] to-[#14060a]" />
        <div className="absolute inset-0 -z-10 opacity-40">
          <CodeRain />
        </div>
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "radial-gradient(70% 55% at 50% 45%, rgba(20,6,10,0.85), rgba(20,6,10,0.2) 75%)" }}
        />

        <header className="flex items-center justify-between px-5 pt-5 sm:px-10 sm:pt-7">
          <div className="flex items-center gap-3">
            <img src={oasis_logo} alt="OASIS" className="h-9 w-auto sm:h-11" />
            <span className="hidden h-6 w-px bg-white/30 sm:block" aria-hidden="true" />
            <img src={aces_logo} alt="ACES" className="hidden h-10 w-10 object-contain sm:block" />
          </div>
          <button type="button" onClick={goToLogin} className="st-btn h-11 px-5 text-xs sm:px-7">
            Log in <FiArrowRight />
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
          <p className="st-mono st-rise text-xs font-bold tracking-wide text-[#f2b400] sm:text-sm">
            &gt; whoami<span className="st-caret" />
          </p>
          <h1
            className="mt-4 text-5xl font-extrabold leading-[1.05] sm:text-7xl lg:text-[96px]"
            style={{ fontFamily: "Montserrat, Inter, sans-serif" }}
          >
            We are
            <br />
            <span className="inline-block min-h-[1.05em] transition-colors duration-300" style={{ color: accent }}>
              {text}
              <span className="st-caret" style={{ background: accent }} />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">
            The College of Computer Studies of Dr. Yanga's Colleges. Join events, scan your ID and watch the points stack up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={goToLogin} className="st-btn px-8">
              Student log in <FiArrowRight />
            </button>
            <a href="#how" className="st-btn-ghost px-8 text-white">
              See how it works <FiArrowDown />
            </a>
          </div>
        </div>

        <Ticker />
      </section>

      {/* ------------------------------------------------------------ photos */}
      <section className="py-20">
        <div className="mx-auto mb-10 max-w-6xl px-5 sm:px-10">
          <Reveal>
            <p className="st-mono text-xs font-bold text-[#f2b400]">// life at CCS</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
              Hackathons, labs, assemblies and everything in between.
            </h2>
          </Reveal>
        </div>
        <PhotoReel />
      </section>

      {/* ------------------------------------------------------------ programs */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-10">
        <Reveal>
          <p className="st-mono text-xs font-bold text-[#f2b400]">// pick your path</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
            Three programs. One home.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PROGRAMS.map((program, i) => (
            <ProgramCard key={program.id} program={program} delay={i * 150} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section id="how" className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-10">
        <Reveal>
          <p className="st-mono text-xs font-bold text-[#f2b400]">// how it works</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
            Attend. Scan. Get cleared.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ title, text: copy, Visual }, i) => (
            <Reveal key={title} delay={i * 150}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="relative h-44 overflow-hidden rounded-2xl bg-black/30">
                  <Visual />
                </div>
                <p className="st-mono mt-5 text-xs font-bold text-[#f2b400]">STEP 0{i + 1}</p>
                <h3 className="mt-1 text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ call to action */}
      <section className="px-5 pb-24 sm:px-10">
        <Reveal>
          <div className="mx-auto max-w-4xl rounded-3xl bg-[#f2b400] px-6 py-14 text-center text-[#2a0507] sm:px-12">
            <h2 className="text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: "Montserrat, Inter, sans-serif" }}>
              Ready to see your points?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-medium opacity-80">
              Log in with your student number. Your admin gives you a temporary password the first time.
            </p>
            <button
              type="button"
              onClick={goToLogin}
              className="st-mono mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-[#2a0507] px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-125"
            >
              Student log in <FiArrowRight />
            </button>
          </div>
        </Reveal>
        <p className="st-mono mt-8 text-center text-[11px] text-white/40">
          Dr. Yanga's Colleges, Inc. &middot; College of Computer Studies &middot; ACES
        </p>
      </section>
    </div>
  );
}
