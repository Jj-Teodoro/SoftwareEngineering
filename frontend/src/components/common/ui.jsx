// Small layout building blocks shared by the admin and scanner pages.

/** Page title with optional action buttons that wrap neatly on phones. */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-1 text-sm muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** A titled card. `action` sits on the right of the title row. */
export function Section({ title, action, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`surface-accent p-4 sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="label text-white/80">{title}</h2>}
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function EmptyState({ children }) {
  return <p className="py-8 text-center text-sm muted">{children}</p>;
}
