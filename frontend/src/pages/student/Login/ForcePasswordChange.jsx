import { useState } from "react";
import { api } from "../../../api/client.js";
import PageBackground from "../../../components/student/PageBackground";
import oasis_logo from "../../../assets/oasis-logo.png";
import { useStudent } from "../../../context/student/StudentContext";

const MIN_LENGTH = 8;

function PasswordInput({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">
        <span className="st-mono text-[var(--gold)]">&gt;</span> {label}
      </span>
      <input type="password" {...props} className="st-input" />
    </label>
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
      await api.changePassword(tempPassword, newPassword);
    } catch (err) {
      setError(
        err.data?.current_password
          ? "The temporary password is incorrect."
          : "Could not update your password. Please try again."
      );
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

  const errorBox = error && (
    <p className="rounded-lg border border-[var(--danger)] p-3 text-sm font-medium text-[var(--danger)]">! {error}</p>
  );

  return (
    <PageBackground>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
        <div className="st-card overflow-hidden">
          <div
            className="flex items-center gap-2 border-b bg-gradient-to-r from-[var(--header-from)] to-[var(--header-to)] px-4 py-2.5"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="st-mono ml-2 truncate text-[11px] text-white/80">oasis://student/new-password</span>
          </div>

          <div className="p-6 sm:p-7">
            <div className="mx-auto mb-5 w-fit rounded-xl bg-[var(--header-to)] px-6 py-2.5">
              <img src={oasis_logo} alt="OASIS" className="h-11 w-auto" />
            </div>
            <h1 className="text-center text-lg font-bold">Set a new password</h1>
            <p className="st-muted mt-2 text-center text-sm leading-relaxed">
              Welcome{student?.name ? `, ${student.name.split(",")[0]}` : ""}. You signed in with a temporary
              password from your admin. Choose your own password to continue. Only you will know it.
            </p>

            {passwordSaved ? (
              <div className="mt-6 space-y-3">
                {errorBox}
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setSubmitting(true);
                    await finish();
                    setSubmitting(false);
                  }}
                  disabled={submitting}
                  className="st-btn w-full"
                >
                  Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <PasswordInput
                  label="Temporary password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <PasswordInput
                  label={`New password (at least ${MIN_LENGTH} characters)`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <PasswordInput
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {errorBox}
                <button type="submit" disabled={submitting} className="st-btn w-full">
                  {submitting ? "Saving..." : "Save password"}
                </button>
              </form>
            )}

            <div className="mt-5 border-t pt-4 text-center" style={{ borderColor: "var(--line)" }}>
              <button type="button" onClick={onLogout} className="st-mono text-sm font-bold text-[var(--accent-text)] hover:underline">
                [ Log out ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
