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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} rounded-[24px] border border-white/20 bg-gradient-to-br from-[#4a080b] via-[#2a0507] to-[#160203] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
