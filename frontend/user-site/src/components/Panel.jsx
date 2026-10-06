export default function Panel({ title, action, children, className = "" }) {
  return (
    <section
      className={`rounded-[14px] border-[1.5px] border-[var(--gold)] bg-[var(--panel-bg)] p-6 text-[var(--text-primary)] ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && (
            <h3 className="font-display text-base uppercase tracking-[3px] text-[var(--panel-title)] sm:text-lg">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
