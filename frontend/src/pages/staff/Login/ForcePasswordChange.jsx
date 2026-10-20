import { useState } from "react";
import PageBackground from "../../../components/common/PageBackground.jsx";
import oasis_logo from "../../../assets/oasislogo.gif";
import { api } from "../../../api/client";

const MIN_LENGTH = 8;

/** First sign-in (or after an admin issues a new password): choose your own password. */
export default function ForcePasswordChange({ staff, onDone, onLogout }) {
  const [temp, setTemp] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters.`);
    if (next !== confirm) return setError("New passwords do not match.");
    if (next === temp) return setError("Choose a password different from the temporary one.");

    setBusy(true);
    try {
      // the server also clears the temporary password and the must-change flag
      await api.changePassword(temp, next);
      onDone();
    } catch (err) {
      setError(
        err.data?.current_password ? "The temporary password is incorrect." : "Could not update your password. Please try again."
      );
    }
    setBusy(false);
  };

  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="surface-accent w-full max-w-md space-y-4 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <img src={oasis_logo} alt="OASIS" className="h-auto w-40 object-contain" />
            <h1 className="page-title mt-2">Set a new password</h1>
            <p className="mt-2 text-sm leading-relaxed muted">
              Welcome, {staff.name}. You signed in with a temporary password from your admin. Choose your own to
              continue — only you will know it.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input type="password" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Temporary password" autoComplete="current-password" required className="input h-11" />
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder={`New password (min. ${MIN_LENGTH} characters)`} autoComplete="new-password" required className="input h-11" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" required className="input h-11" />
            {error && <p className="text-sm text-neon-pink">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary h-11 w-full">{busy ? "Saving..." : "Save password"}</button>
          </form>

          <button type="button" onClick={onLogout} className="label block w-full text-center hover:text-white">
            [ Log out ]
          </button>
        </div>
      </div>
    </PageBackground>
  );
}
