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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
            state.danger ? "bg-red-600/20 text-red-300" : "bg-gold/15 text-gold"
          }`}
        >
          <FiAlertTriangle size={20} />
        </div>
        <div className="min-w-0 pr-6">
          <h2 className="page-title pr-6">
            {state.title || "Are you sure?"}
          </h2>
          {state.message && (
            <p className="mt-2 text-sm leading-relaxed muted">{state.message}</p>
          )}
        </div>
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => settle(false)}
          autoFocus
          className="btn-ghost"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => settle(true)}
          className={state.danger ? "btn border-transparent bg-red-600 text-white hover:bg-red-700" : "btn-primary"}
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
