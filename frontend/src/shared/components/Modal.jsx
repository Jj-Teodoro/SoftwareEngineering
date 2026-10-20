import { useEffect } from "react";
import { FiX } from "react-icons/fi";

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={onClose}
    >
      <div
        className={`surface-accent relative max-h-[92vh] w-full overflow-y-auto rounded-b-none bg-[#150b0c] p-5 shadow-2xl sm:rounded-b-xl sm:p-7 ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn-icon absolute right-3 top-3 border-transparent bg-transparent"
          aria-label="Close"
        >
          <FiX size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
