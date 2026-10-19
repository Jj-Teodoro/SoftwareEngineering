export default function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-base)] font-['Montserrat',sans-serif] transition-colors">
      {/* neon glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 15% 0%, var(--bg-glow-1), transparent 70%), radial-gradient(ellipse 55% 40% at 100% 100%, var(--bg-glow-2), transparent 70%)",
        }}
      />
      {/* city grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.9),rgba(0,0,0,0.15))]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--scan) 0, var(--scan) 1px, transparent 1px, transparent 4px)",
        }}
      />
      {/* slow scan beam */}
      <div className="cp-sweep pointer-events-none absolute inset-x-0 top-0 h-24 animate-[sweep_9s_linear_infinite] bg-gradient-to-b from-transparent via-[var(--neon-cyan)] to-transparent opacity-[0.06]" />
      {/* vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45))]" />
      <div className="relative z-10 min-h-screen text-[var(--text-primary)]">{children}</div>
    </div>
  );
}
