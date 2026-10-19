import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import CyberFrame from "./CyberFrame";

export default function CyberModal({ onClose, children, maxWidth = "max-w-lg", tag }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <CyberFrame cut={26} innerClassName="p-6 sm:p-8" tag={tag}>
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-1 -top-1 p-1.5 text-[var(--gold)] transition-colors hover:text-[var(--neon-pink)]"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
          {children}
        </CyberFrame>
      </div>
    </div>
  );
}
