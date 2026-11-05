import { useEffect } from "react";
import { FiLoader, FiUsers } from "react-icons/fi";

/**
 * Full-screen loading screen for long jobs (importing students, creating accounts).
 * It covers the whole page so nothing can be clicked while the job runs, and asks the
 * browser to warn before the tab is closed or reloaded mid-way.
 */
export default function ProgressOverlay({ title, done, total, doneLabel = "done", step, icon: Icon = FiUsers }) {
  useEffect(() => {
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const ring = 2 * Math.PI * 52;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={title}
    >
      <div className="surface-accent w-full max-w-sm p-6 text-center shadow-2xl sm:p-8">
        <div className="relative mx-auto h-32 w-32">
          {/* a faint spinning dashed ring behind the progress ring, so it never looks frozen */}
          <svg className="absolute inset-0 h-full w-full animate-spin [animation-duration:3s]" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="58" fill="none" stroke="rgba(5,217,232,0.35)" strokeWidth="1.5" strokeDasharray="4 10" />
          </svg>
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#f2b400"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - pct / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold leading-none">{pct}%</span>
            <Icon size={14} className="mt-1.5 text-gold/80" />
          </div>
        </div>

        <h2 className="page-title mt-5">{title}</h2>
        <p className="mt-2 font-mono text-sm">
          <span className="text-gold">{done}</span>
          <span className="muted"> of {total} {doneLabel}</span>
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-gold to-[#ffc933] transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(pct, 4)}%` }}
          >
            <span className="absolute inset-0 animate-pulse bg-white/25" />
          </div>
        </div>

        {step && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/80">
            <FiLoader size={14} className="animate-spin text-neon-cyan" /> {step}
          </p>
        )}
        <p className="mt-2 text-xs muted">Please wait and keep this page open until it finishes.</p>
      </div>
    </div>
  );
}
