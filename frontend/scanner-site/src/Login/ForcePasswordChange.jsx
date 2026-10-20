import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@oasis/shared/firebaseClient.js";
import PageBackground from "@oasis/shared/components/PageBackground.jsx";
import oasis_logo from "../assets/oasislogo.gif";
import { useAuth } from "../context/AuthContext";

const MIN_LENGTH = 8;

/** First sign-in (or after an admin re-issues the account): choose your own password. */
export default function ForcePasswordChange({ staff, onDone, onLogout }) {
  const { completePasswordChange } = useAuth();
  const [temp, setTemp] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // The password is already changed at this point; if marking the account as set
  // up fails, they can retry without needing the temporary password again.
  const finish = async () => {
    try {
      await completePasswordChange(staff);
      onDone();
    } catch {
      setError("Your password was changed, but we couldn't finish. Tap Continue to retry.");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < MIN_LENGTH) return setError(`New password must be at least ${MIN_LENGTH} characters.`);
    if (next !== confirm) return setError("New passwords do not match.");
    if (next === temp) return setError("Choose a password different from the temporary one.");

    setBusy(true);
    try {
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, temp));
    } catch {
      setBusy(false);
      return setError("The temporary password is incorrect.");
    }
    try {
      await updatePassword(auth.currentUser, next);
    } catch {
      setBusy(false);
      return setError("Could not update your password. Please try again.");
    }
    setSaved(true);
    await finish();
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

          {saved ? (
            <button type="button" onClick={async () => { setError(""); setBusy(true); await finish(); setBusy(false); }} disabled={busy} className="btn-primary h-11 w-full">
              Continue
            </button>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input type="password" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Temporary password" autoComplete="current-password" required className="input h-11" />
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder={`New password (min. ${MIN_LENGTH} characters)`} autoComplete="new-password" required className="input h-11" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" required className="input h-11" />
              {error && <p className="text-sm text-neon-pink">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary h-11 w-full">{busy ? "Saving..." : "Save password"}</button>
            </form>
          )}
          {saved && error && <p className="text-sm text-neon-pink">{error}</p>}

          <button type="button" onClick={onLogout} className="label block w-full text-center hover:text-white">
            [ Log out ]
          </button>
        </div>
      </div>
    </PageBackground>
  );
}
