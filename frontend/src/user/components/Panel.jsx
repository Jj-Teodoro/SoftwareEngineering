import CyberFrame from "./CyberFrame";

export default function Panel({ title, action, children, className = "" }) {
  const tag = title ? `sys://${title.toLowerCase().replace(/\s+/g, "_")}` : undefined;
  return (
    <CyberFrame className={className} innerClassName="px-6 pb-8 pt-7" tag={tag}>
      {(title || action) && (
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            {title && (
              <h3 className="cp-glitch font-display text-base uppercase tracking-[3px] text-[var(--panel-title)] sm:text-lg">
                {title}
              </h3>
            )}
            {action}
          </div>
          <div className="mt-3 flex items-center gap-1" aria-hidden="true">
            <span className="h-[2px] w-10 bg-[var(--gold)] shadow-[0_0_6px_var(--glow)]" />
            <span className="h-px flex-1 bg-[var(--surface-border)]" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[var(--gold)]" />
          </div>
        </div>
      )}
      {children}
    </CyberFrame>
  );
}
