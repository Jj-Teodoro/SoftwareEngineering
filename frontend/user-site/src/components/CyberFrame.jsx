// Gold-bordered, cut-corner container with a faint grid and scanlines. The
// shared building block for panels, the header, cards and the login screens.
const poly = (tl, tr, br, bl) =>
  `polygon(${tl}px 0, calc(100% - ${tr}px) 0, 100% ${tr}px, 100% calc(100% - ${br}px), calc(100% - ${br}px) 100%, ${bl}px 100%, 0 calc(100% - ${bl}px), 0 ${tl}px)`;

export function Slashes({ className = "" }) {
  return (
    <span className={`pointer-events-none absolute flex gap-1 ${className}`} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          className="h-3 w-1 -skew-x-[30deg] bg-[var(--gold)]"
          style={{ opacity: 1 - i * 0.28 }}
        />
      ))}
    </span>
  );
}

export default function CyberFrame({
  children,
  className = "",
  innerClassName = "",
  cut = 18,
  border = "var(--gold)",
  slashes = true,
  tag,
}) {
  const small = Math.max(6, Math.round(cut / 2.6));
  return (
    <div className={className} style={{ filter: "drop-shadow(0 0 7px var(--glow))" }}>
      <div
        style={{ clipPath: poly(cut, small, cut, small), background: border }}
        className="h-full p-[2px]"
      >
        <div
          style={{
            clipPath: poly(cut - 2, small - 1, cut - 2, small - 1),
            backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px), var(--frame-bg)`,
            backgroundSize: "18px 18px, 18px 18px, 100% 100%",
          }}
          className={`relative h-full text-[var(--text-primary)] ${innerClassName}`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, var(--scan) 0, var(--scan) 1px, transparent 1px, transparent 3px)",
            }}
            aria-hidden="true"
          />
          {tag && (
            <span className="pointer-events-none absolute right-12 top-2.5 font-mono text-[8px] uppercase tracking-[2px] text-[var(--gold)] opacity-80">
              {tag}
            </span>
          )}
          <div className="relative">{children}</div>
          {slashes && (
            <>
              <Slashes className="bottom-2.5 left-5" />
              <Slashes className="right-5 top-2.5" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
