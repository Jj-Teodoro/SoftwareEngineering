import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@oasis/shared/firebaseClient.js";
import PageBackground from "../components/PageBackground";
import oasis_logo from "../assets/oasislogo.gif";
import { useAuth } from "../context/AuthContext";
import { useStudent } from "../context/StudentContext";

const MIN_LENGTH = 8;

const inputClass =
  "h-12 w-full rounded-lg border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--gold)]";

export default function ForcePasswordChange() {
  const { signOut } = useAuth();
  const { student, completePasswordChange } = useStudent();
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword === tempPassword) {
      setError("Choose a password different from the temporary one.");
      return;
    }

    setSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, tempPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
    } catch {
      setError("The temporary password is incorrect.");
      setSubmitting(false);
      return;
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch {
      setError("Could not update your password. Please try again.");
      setSubmitting(false);
      return;
    }

    setPasswordSaved(true);
    await finish();
    setSubmitting(false);
  };

  // The password is already changed at this point; if marking the account as
  // set up fails, the student can retry without needing the old password.
  const finish = async () => {
    try {
      await completePasswordChange();
    } catch {
      setError("Your password was changed, but we couldn't finish setting up. Tap Continue to retry.");
    }
  };

  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[20px] border-2 border-[var(--gold)] bg-[var(--panel-bg)] p-8 text-[var(--text-primary)] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <img src={oasis_logo} alt="OASIS" className="mx-auto mb-2 h-auto w-[180px] object-contain" />
          <h1 className="text-center font-display text-base uppercase tracking-[3px] text-[var(--panel-title)]">
            Set a new password
          </h1>
          <p className="mt-3 text-center text-xs leading-relaxed text-[var(--text-muted)]">
            Welcome{student?.name ? `, ${student.name.split(",")[0]}` : ""}. You signed in with a
            temporary password from your admin. Choose your own password to continue — only you
            will know it.
          </p>

          {passwordSaved ? (
            <div className="mt-6 space-y-3">
              {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setSubmitting(true);
                  await finish();
                  setSubmitting(false);
                }}
                disabled={submitting}
                className="h-12 w-full rounded-lg bg-[var(--gold)] text-sm font-bold uppercase tracking-[2px] text-[#2b0a0c] disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Temporary password"
              required
              className={inputClass}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`New password (min. ${MIN_LENGTH} characters)`}
              required
              className={inputClass}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className={inputClass}
            />
            {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-lg bg-[var(--gold)] text-sm font-bold uppercase tracking-[2px] text-[#2b0a0c] transition-all hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save password"}
            </button>
          </form>
          )}

          <button
            type="button"
            onClick={signOut}
            className="mt-4 block w-full text-center text-xs uppercase tracking-[2px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Log out
          </button>
        </div>
      </div>
    </PageBackground>
  );
}
