import { createContext, useCallback, useContext, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import Modal from "./Modal.jsx";

const ConfirmContext = createContext(null);

/**
 * In-app replacement for window.confirm (native popups are blocked or hidden in
 * some embedded browsers, which made buttons like Delete look broken).
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel, danger: true }))) return;
 *
 * Wrap the app once in <ConfirmProvider>.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (options) => new Promise((resolve) => setState({ ...options, resolve })),
    []
  );

  const settle = (value) => {
    state?.resolve(value);
    setState(null);
  };

  const dialog = state ? (
    <Modal onClose={() => settle(false)} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            state.danger ? "bg-red-600/25 text-red-300" : "bg-[#f2b400]/20 text-[#f2b400]"
          }`}
        >
          <FiAlertTriangle size={20} />
        </div>
        <div className="min-w-0 pr-6">
          <h2 className="text-base font-bold uppercase tracking-[2px] text-white">
            {state.title || "Are you sure?"}
          </h2>
          {state.message && (
            <p className="mt-2 text-sm leading-relaxed text-white/75">{state.message}</p>
          )}
        </div>
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => settle(false)}
          autoFocus
          className="h-11 rounded-full border border-white/40 bg-white/5 px-6 text-xs font-bold uppercase tracking-[2px] text-white transition-all hover:bg-white/15"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => settle(true)}
          className={`h-11 rounded-full px-6 text-xs font-bold uppercase tracking-[2px] text-white transition-all ${
            state.danger ? "bg-red-600 hover:bg-red-700" : "bg-[#97191d] hover:bg-[#b81f25]"
          }`}
        >
          {state.confirmLabel || "Confirm"}
        </button>
      </div>
    </Modal>
  ) : null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return confirm;
}
