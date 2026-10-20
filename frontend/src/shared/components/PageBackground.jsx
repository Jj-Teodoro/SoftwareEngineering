// Dark base with a faint grid and a maroon glow. Kept subtle so content stays readable.
export default function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen bg-ink font-['Montserrat',sans-serif] text-white">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 0% 0%, rgba(151,25,29,.35), transparent 70%), linear-gradient(rgba(242,180,0,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(242,180,0,.035) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
