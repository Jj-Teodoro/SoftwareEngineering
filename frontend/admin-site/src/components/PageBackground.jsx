export default function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#4a080b] via-[#230405] to-black font-['Montserrat',sans-serif]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] opacity-10 [background-size:10px_10px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,0.08))]" />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
