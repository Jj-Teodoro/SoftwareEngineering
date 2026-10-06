import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@oasis/shared/firebaseClient.js";
import PageBackground from "../components/PageBackground";
import CyberFrame from "../components/CyberFrame";
import oasis_logo from "../assets/oasislogo.gif";
import { useStudent } from "../context/StudentContext";

const MIN_LENGTH = 8;

const inputClass =
  "h-12 w-full bg-transparent px-4 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none";

function CpInput(props) {
  return (
    <div className="cp-field">
      <input {...props} className={inputClass} />
    </div>
  );
}

export default function ForcePasswordChange({ onLogout }) {
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
        <CyberFrame className="w-full max-w-md" innerClassName="p-8" cut={26} tag="sys://new_password">
          <img src={oasis_logo} alt="OASIS" className="mx-auto mb-2 h-auto w-[180px] object-contain" />
          <h1 className="cp-glitch text-center font-display text-base uppercase tracking-[3px] text-[var(--panel-title)]">
            Set a new password
          </h1>
          <p className="mt-3 text-center font-mono text-xs leading-relaxed text-[var(--text-muted)]">
            Welcome{student?.name ? `, ${student.name.split(",")[0]}` : ""}. You signed in with a
            temporary password from your admin. Choose your own password to continue — only you
            will know it.
          </p>

          {passwordSaved ? (
            <div className="mt-6 space-y-3">
              {error && (
                <p className="font-mono text-xs font-bold uppercase tracking-[1px] text-[var(--neon-pink)]">
                  ! {error}
                </p>
              )}
              <button
                type="button"
                onClick={async () => {
                  setError("");
                  setSubmitting(true);
                  await finish();
                  setSubmitting(false);
                }}
                disabled={submitting}
                className="cp-btn h-12 w-full text-sm"
              >
                Continue
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <CpInput
              type="password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Temporary password"
              required
            />
            <CpInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`New password (min. ${MIN_LENGTH} characters)`}
              required
            />
            <CpInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            {error && (
                <p className="font-mono text-xs font-bold uppercase tracking-[1px] text-[var(--neon-pink)]">
                  ! {error}
                </p>
              )}
            <button
              type="submit"
              disabled={submitting}
              className="cp-btn h-12 w-full text-sm"
            >
              {submitting ? "Saving..." : "Save password"}
            </button>
          </form>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 block w-full text-center font-mono text-xs uppercase tracking-[2px] text-[var(--text-muted)] transition-colors hover:text-[var(--neon-cyan)]"
          >
            [ Log out ]
          </button>
        </CyberFrame>
      </div>
    </PageBackground>
  );
}
