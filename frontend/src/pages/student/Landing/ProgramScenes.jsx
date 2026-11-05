// Three small animated pictures, one per program. Everything moves by itself with CSS only.

const frame = "rgba(255,255,255,0.2)";
const dark = "#1b0a0c";

export const PROGRAMS = [
  {
    id: "bsit",
    code: "BSIT",
    name: "Information Technology",
    accent: "#d6434b",
    tagline: "Build the web.",
    blurb: "Websites, apps, networks and databases: the tools that keep a whole campus running.",
    topics: ["Web & apps", "Networks", "Databases"],
  },
  {
    id: "bscpe",
    code: "BSCpE",
    name: "Computer Engineering",
    accent: "#ff8a1f",
    tagline: "Wire the machines.",
    blurb: "Chips, sensors and robots: design the hardware, then program it to think.",
    topics: ["Embedded", "Electronics", "Robotics"],
  },
  {
    id: "bscs",
    code: "BSCS",
    name: "Computer Science",
    accent: "#2fd47a",
    tagline: "Crack the code.",
    blurb: "Algorithms, AI and the ideas behind great software, from theory to working code.",
    topics: ["Algorithms", "AI & data", "Software design"],
  },
];

// A web page that builds itself, block by block, while little servers answer a ping.
function WebScene({ accent }) {
  const blocks = [
    { x: 24, y: 58, w: 232, h: 40, delay: "0s", fill: accent },
    { x: 24, y: 108, w: 108, h: 54, delay: "0.5s" },
    { x: 148, y: 108, w: 108, h: 54, delay: "0.9s" },
    { x: 24, y: 172, w: 232, h: 10, delay: "1.3s" },
  ];
  return (
    <svg viewBox="0 0 280 200" className="h-full w-full" role="img" aria-label="A web page being built">
      <rect x="6" y="6" width="268" height="188" rx="14" fill={dark} stroke={frame} />
      <rect x="6" y="6" width="268" height="30" rx="14" fill="rgba(255,255,255,0.07)" />
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
        <circle key={c} cx={24 + i * 14} cy="21" r="4" fill={c} />
      ))}
      <rect x="84" y="14" width="120" height="14" rx="7" fill="rgba(255,255,255,0.1)" />
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="8"
          fill={b.fill || "rgba(255,255,255,0.14)"}
          className="st-build"
          style={{ animationDelay: b.delay, opacity: b.fill ? 0.9 : 1 }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={226 + i * 18} cy="21" r="3" fill={accent} />
          <circle cx={226 + i * 18} cy="21" r="3" fill="none" stroke={accent} className="st-ping" style={{ animationDelay: `${i * 0.5}s` }} />
        </g>
      ))}
    </svg>
  );
}

// A chip with current running along its traces and a die that pulses.
function ChipScene({ accent }) {
  const traces = [
    "M60 90H20", "M60 110H30V150", "M60 130H10",
    "M220 90H260", "M220 110H250V60", "M220 130H270",
    "M100 60V20", "M130 60V10", "M160 60V25",
    "M100 160V190", "M130 160V180", "M160 160V195",
  ];
  return (
    <svg viewBox="0 0 280 200" className="h-full w-full" role="img" aria-label="A computer chip with current flowing">
      {traces.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" className="st-dash" style={{ animationDelay: `${(i % 4) * 0.25}s`, animationDirection: i % 2 ? "reverse" : "normal" }} opacity="0.85" />
      ))}
      <rect x="60" y="60" width="160" height="100" rx="14" fill={dark} stroke={frame} strokeWidth="1.5" />
      <rect x="86" y="76" width="108" height="68" rx="9" fill={accent} className="st-glow" opacity="0.85" />
      <text x="140" y="118" textAnchor="middle" fontSize="22" fontWeight="800" fill="#2a0507" fontFamily="JetBrains Mono, monospace">
        CpE
      </text>
      {[[22, 90], [262, 130], [130, 12], [130, 188]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#fff" className="st-glow" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
    </svg>
  );
}

// Code that types itself line by line next to a tree whose nodes appear one after another.
function CodeScene({ accent }) {
  const lines = [
    [16, 90, accent], [32, 120, "#ffffff"], [32, 80, "#ff9fbd"],
    [48, 100, "#ffffff"], [32, 70, "#ffffff"], [16, 24, accent],
  ];
  const nodes = [[220, 62], [190, 104], [250, 104], [172, 146], [208, 146], [262, 146]];
  return (
    <svg viewBox="0 0 280 200" className="h-full w-full" role="img" aria-label="Code being typed and a tree growing">
      <rect x="6" y="6" width="268" height="188" rx="14" fill={dark} stroke={frame} />
      <rect x="6" y="6" width="268" height="30" rx="14" fill="rgba(255,255,255,0.07)" />
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
        <circle key={c} cx={24 + i * 14} cy="21" r="4" fill={c} />
      ))}
      {lines.map(([indent, width, color], i) => (
        <rect key={i} x={20 + indent} y={52 + i * 22} width={width} height="9" rx="4.5" fill={color} className="st-build" style={{ animationDelay: `${i * 0.45}s` }} />
      ))}
      <rect x="20" y="52" width="4" height="9" fill="#fff" className="st-caret-svg" />
      <g stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none">
        <path d="M220 62L190 104M220 62L250 104M190 104L172 146M190 104L208 146M250 104L262 146" />
      </g>
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="11" fill="#2a1316" stroke={accent} strokeWidth="2" className="st-node" style={{ animationDelay: `${i * 0.6}s` }} />
      ))}
    </svg>
  );
}

export const SCENES = { bsit: WebScene, bscpe: ChipScene, bscs: CodeScene };
