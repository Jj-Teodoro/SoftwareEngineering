import { useEffect } from "react";
import { FiX } from "react-icons/fi";

// A centred card on desktop and a bottom sheet on phones.
export default function Modal({ onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`st-card relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-3xl sm:p-7 ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--card-2)] hover:text-[var(--text-primary)]"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
