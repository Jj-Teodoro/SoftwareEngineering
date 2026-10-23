export default function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`st-card p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="st-title">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
