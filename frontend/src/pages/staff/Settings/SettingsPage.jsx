import { useState } from "react";
import { api } from "../../../api/client.js";
import { PageHeader, Section } from "../../../components/common/ui.jsx";

export default function SettingsPage({ currentUser }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setStatus({ type: "success", message: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setStatus({
        type: "error",
        message: error.data?.current_password ? "Current password is incorrect." : error.message,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <PageHeader title="Settings" />

      <Section title="Signed in as">
        <p className="text-base font-semibold">{currentUser?.name}</p>
        <p className="font-mono text-xs muted">{currentUser?.username} · {currentUser?.role}</p>
      </Section>

      <Section title="Change password">
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            required
            className="input h-11"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            required
            className="input h-11"
          />
          {status && (
            <p className={`text-sm ${status.type === "success" ? "text-green-300" : "text-neon-pink"}`}>
              {status.message}
            </p>
          )}
          <button type="submit" disabled={isSubmitting} className="btn-primary h-11">
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </Section>
    </div>
  );
}
