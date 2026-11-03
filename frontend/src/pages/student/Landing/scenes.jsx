import {
  FiActivity,
  FiCloud,
  FiCode,
  FiCpu,
  FiDatabase,
  FiGitBranch,
  FiGlobe,
  FiMousePointer,
  FiServer,
  FiSettings,
  FiTerminal,
  FiWifi,
  FiZap,
} from "react-icons/fi";

// The three programs the front page is built around. `accent` tints the whole scene.
export const PROGRAMS = [
  {
    id: "bsit",
    code: "BSIT",
    name: "Information Technology",
    ghost: "INFORMATION TECHNOLOGY",
    accent: "#4fc3d1",
    headline: "Build the web, the networks and the systems behind them.",
    blurb: "Websites, apps, networks and databases: the tools that keep a whole campus running.",
    topics: ["Web & apps", "Networks", "Databases"],
  },
  {
    id: "bscpe",
    code: "BSCpE",
    name: "Computer Engineering",
    ghost: "COMPUTER ENGINEERING",
    accent: "#f2b400",
    headline: "Where hardware meets software.",
    blurb: "Chips, sensors and robots: design the machines, then program them to think.",
    topics: ["Embedded systems", "Electronics", "Robotics"],
  },
  {
    id: "bscs",
    code: "BSCS",
    name: "Computer Science",
    ghost: "COMPUTER SCIENCE",
    accent: "#ff6b9d",
    headline: "Algorithms, data and the ideas behind great software.",
    blurb: "Theory and code together: algorithms, AI and the design of software that scales.",
    topics: ["Algorithms", "AI & data", "Software design"],
  },
];

const dark = "#1b0a0c";
const edge = "rgba(255,255,255,0.22)";
const accentFill = { stopColor: "var(--accent)" };

// ----------------------------------------------------------------- BSIT: a browser window
function Browser() {
  return (
    <svg viewBox="0 0 320 250" className="h-full w-full" role="img" aria-label="A website in a browser window">
      <defs>
        <linearGradient id="it-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a1a1d" />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id="it-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={accentFill} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="300" height="230" rx="20" fill="url(#it-win)" stroke={edge} />
      <rect x="10" y="10" width="300" height="36" rx="20" fill="rgba(255,255,255,0.07)" />
      <circle cx="32" cy="28" r="5" fill="#ff5f57" />
      <circle cx="48" cy="28" r="5" fill="#febc2e" />
      <circle cx="64" cy="28" r="5" fill="#28c840" />
      <rect x="92" y="19" width="170" height="18" rx="9" fill="rgba(255,255,255,0.1)" />
      <text x="106" y="32" fontSize="9" fill="rgba(255,255,255,0.65)" fontFamily="JetBrains Mono, monospace">
        oasis.edu/it
      </text>
      <rect x="26" y="62" width="268" height="76" rx="12" fill="url(#it-hero)" />
      <rect x="40" y="78" width="112" height="11" rx="5" fill="#fff" opacity="0.92" />
      <rect x="40" y="97" width="150" height="6" rx="3" fill="#fff" opacity="0.6" />
      <rect x="40" y="112" width="58" height="16" rx="8" fill={dark} />
      {[26, 119, 212].map((x, i) => (
        <g key={x}>
          <rect x={x} y="152" width="82" height="76" rx="12" fill="rgba(255,255,255,0.07)" stroke={edge} />
          <circle cx={x + 18} cy="172" r="9" style={{ fill: "var(--accent)" }} opacity={0.9 - i * 0.2} />
          <rect x={x + 12} y="192" width="56" height="6" rx="3" fill="#fff" opacity="0.7" />
          <rect x={x + 12} y="206" width="38" height="6" rx="3" fill="#fff" opacity="0.4" />
        </g>
      ))}
    </svg>
  );
}

// ----------------------------------------------------------------- BSCpE: a microchip
function Chip() {
  const pins = Array.from({ length: 7 }, (_, i) => 74 + i * 25);
  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" role="img" aria-label="A microchip">
      <defs>
        <linearGradient id="ce-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f1d20" />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id="ce-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={accentFill} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="ce-pin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbe08a" />
          <stop offset="1" stopColor="#b98500" />
        </linearGradient>
      </defs>
      {pins.map((p) => (
        <g key={p}>
          <rect x={p} y="14" width="12" height="40" rx="3" fill="url(#ce-pin)" />
          <rect x={p} y="246" width="12" height="40" rx="3" fill="url(#ce-pin)" />
          <rect x="14" y={p} width="40" height="12" rx="3" fill="url(#ce-pin)" />
          <rect x="246" y={p} width="40" height="12" rx="3" fill="url(#ce-pin)" />
        </g>
      ))}
      <rect x="46" y="46" width="208" height="208" rx="24" fill="url(#ce-body)" stroke={edge} strokeWidth="1.5" />
      <path d="M70 80h42l14 14h40M70 220h60l14-14h50M230 120v40l-14 14" fill="none" style={{ stroke: "var(--accent)" }} strokeOpacity="0.5" strokeWidth="2" />
      <rect x="92" y="92" width="116" height="116" rx="14" fill="url(#ce-die)" />
      <rect x="104" y="104" width="92" height="92" rx="8" fill="none" stroke="rgba(42,5,7,0.35)" strokeWidth="2" />
      <text x="150" y="162" textAnchor="middle" fontSize="30" fontWeight="800" fill="#2a0507" fontFamily="JetBrains Mono, monospace">
        CpE
      </text>
      <circle cx="62" cy="62" r="4" fill="#fff" opacity="0.8" />
    </svg>
  );
}

// ----------------------------------------------------------------- BSCS: a code editor with a tree
function Editor() {
  const lines = [
    [14, 56, "var(--accent)"],
    [34, 90, "#ffffff"],
    [34, 64, "#ff9fbd"],
    [54, 76, "#ffffff"],
    [54, 48, "var(--accent)"],
    [34, 80, "#ffffff"],
    [14, 30, "var(--accent)"],
  ];
  return (
    <svg viewBox="0 0 320 250" className="h-full w-full" role="img" aria-label="A code editor and a tree of nodes">
      <defs>
        <linearGradient id="cs-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#331619" />
          <stop offset="1" stopColor="#150709" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="300" height="230" rx="20" fill="url(#cs-win)" stroke={edge} />
      <rect x="10" y="10" width="300" height="36" rx="20" fill="rgba(255,255,255,0.07)" />
      <circle cx="32" cy="28" r="5" fill="#ff5f57" />
      <circle cx="48" cy="28" r="5" fill="#febc2e" />
      <circle cx="64" cy="28" r="5" fill="#28c840" />
      <text x="92" y="32" fontSize="10" fill="rgba(255,255,255,0.65)" fontFamily="JetBrains Mono, monospace">
        search.js
      </text>
      {lines.map(([indent, width, color], i) => (
        <g key={i}>
          <text x="22" y={74 + i * 24} fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
            {i + 1}
          </text>
          <rect x={38 + indent} y={65 + i * 24} width={width} height="9" rx="4.5" style={{ fill: color }} opacity="0.9" />
        </g>
      ))}
      {/* a small binary tree */}
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none">
        <path d="M244 84L218 118M244 84L270 118M218 118L204 154M218 118L232 154M270 118L284 154" />
      </g>
      {[
        [244, 84],
        [218, 118],
        [270, 118],
        [204, 154],
        [232, 154],
        [284, 154],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="11" style={{ fill: i === 0 ? "var(--accent)" : "#2a1316" }} stroke="var(--accent)" strokeWidth="2" />
      ))}
      <rect x="196" y="190" width="100" height="30" rx="8" fill="rgba(255,255,255,0.07)" stroke={edge} />
      <text x="246" y="210" textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: "var(--accent)" }} fontFamily="JetBrains Mono, monospace">
        O(log n)
      </text>
    </svg>
  );
}

const MAIN = { bsit: Browser, bscpe: Chip, bscs: Editor };

// Round glossy icon bubbles that float around the main object. `at` is a position in the scene box.
const SATELLITES = {
  bsit: [
    { Icon: FiGlobe, at: "left-[2%] top-[6%]", size: 78, depth: 30 },
    { Icon: FiWifi, at: "right-[4%] top-[2%]", size: 58, depth: 44 },
    { Icon: FiMousePointer, at: "right-[0%] bottom-[16%]", size: 64, depth: 24 },
    { Icon: FiCloud, at: "left-[0%] bottom-[10%]", size: 66, depth: 38 },
    { Icon: FiServer, at: "left-[42%] -bottom-[4%]", size: 50, depth: 52 },
  ],
  bscpe: [
    { Icon: FiSettings, at: "left-[0%] top-[8%]", size: 74, depth: 30 },
    { Icon: FiZap, at: "right-[2%] top-[4%]", size: 60, depth: 44 },
    { Icon: FiActivity, at: "right-[0%] bottom-[14%]", size: 62, depth: 24 },
    { Icon: FiCpu, at: "left-[2%] bottom-[8%]", size: 64, depth: 38 },
  ],
  bscs: [
    { Icon: FiCode, at: "left-[0%] top-[6%]", size: 76, depth: 30 },
    { Icon: FiTerminal, at: "right-[2%] top-[2%]", size: 60, depth: 44 },
    { Icon: FiGitBranch, at: "right-[0%] bottom-[12%]", size: 66, depth: 24 },
    { Icon: FiDatabase, at: "left-[2%] bottom-[8%]", size: 62, depth: 38 },
  ],
};

const SPARKLES = [
  { at: "left-[14%] top-[30%]", size: 18, delay: "0s" },
  { at: "right-[18%] top-[22%]", size: 26, delay: "0.8s" },
  { at: "right-[8%] bottom-[34%]", size: 14, delay: "1.6s" },
  { at: "left-[30%] bottom-[2%]", size: 20, delay: "2.2s" },
];

function Sparkle({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill="#fff" />
    </svg>
  );
}

const layer = (depth) => ({
  transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px), 0)`,
});

// One program's scene. Every layer moves a different amount with the pointer, and the main
// object also tilts in 3D, which is what makes it feel like it has depth.
export function ProgramScene({ program, active, motion }) {
  const Main = MAIN[program.id];
  return (
    <div
      className={`absolute inset-0 transition-all duration-500 ease-out ${
        active ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
      }`}
      style={{ "--accent": program.accent }}
      aria-hidden={!active}
    >
      {SPARKLES.map((s) => (
        <span
          key={s.at}
          className={`absolute ${s.at} ${motion ? "st-twinkle" : ""}`}
          style={{ ...layer(60), animationDelay: s.delay }}
        >
          <Sparkle size={s.size} />
        </span>
      ))}

      <div className="absolute inset-[6%] sm:inset-[12%]" style={layer(14)}>
        <div
          className={`h-full w-full ${motion ? "st-float" : ""}`}
          style={{
            transform: "perspective(900px) rotateY(calc(var(--px, 0) * 10deg)) rotateX(calc(var(--py, 0) * -8deg))",
            filter: "drop-shadow(0 28px 36px rgba(0,0,0,0.55))",
            transition: "transform 0.2s ease-out",
          }}
        >
          <Main />
        </div>
      </div>

      {SATELLITES[program.id].map(({ Icon, at, size, depth }, i) => (
        <div key={at} className={`absolute ${at}`} style={layer(depth)}>
          <div
            className={`flex items-center justify-center rounded-full border border-white/25 text-white shadow-[0_14px_28px_rgba(0,0,0,0.45),inset_0_2px_6px_rgba(255,255,255,0.35)] backdrop-blur ${
              motion ? "st-float" : ""
            }`}
            style={{
              width: size,
              height: size,
              background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5), var(--accent) 60%)",
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4.5 + i * 0.6}s`,
            }}
          >
            <Icon size={Math.round(size * 0.42)} />
          </div>
        </div>
      ))}
    </div>
  );
}
