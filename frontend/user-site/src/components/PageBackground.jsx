export default function PageBackground({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden font-['Montserrat',sans-serif] transition-colors"
      style={{ background: "var(--bg-gradient)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1.2px,transparent_1.2px)] text-[var(--text-primary)] opacity-10 [background-size:10px_10px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,0.08))]" />
      <div className="relative z-10 min-h-screen text-[var(--text-primary)]">{children}</div>
    </div>
  );
}
