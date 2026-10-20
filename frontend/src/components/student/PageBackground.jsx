export default function PageBackground({ children }) {
  return (
    <div className="st-root min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors">
      {children}
    </div>
  );
}
