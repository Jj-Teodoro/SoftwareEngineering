import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "@oasis/shared/firebaseClient.js";

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
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setStatus({ type: "success", message: "Password updated." });
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setStatus({ type: "error", message: "Current password is incorrect." });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Settings</h2>

      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="text-xs font-bold uppercase tracking-[2px] text-white/70">Signed in as</p>
        <p className="mt-2 text-base font-bold text-white">{currentUser?.name}</p>
        <p className="text-xs text-white/60">
          {currentUser?.studentId} · {currentUser?.role}
        </p>
      </div>

      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <p className="mb-4 text-xs font-bold uppercase tracking-[2px] text-white/70">
          Change Password
        </p>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            required
            className="h-11 w-full rounded-lg border border-white/30 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/60"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            className="h-11 w-full rounded-lg border border-white/30 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/60"
          />
          {status && (
            <p
              className={`text-xs font-semibold ${
                status.type === "success" ? "text-green-300" : "text-red-300"
              }`}
            >
              {status.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-full bg-[#97191d] text-sm font-bold uppercase tracking-[2px] text-white transition-all hover:bg-[#b81f25] disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
