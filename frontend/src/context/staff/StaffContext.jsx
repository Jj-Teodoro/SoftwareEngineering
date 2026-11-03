import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useSignedIn, usePolling } from "../../api/hooks";
import { fromStudent, toStaff } from "../../api/mappers";

const StaffContext = createContext(null);

// A staff heartbeat arrives every 30s while they use the admin or scanner portal.
const ACTIVE_WINDOW_MS = 90 * 1000;
const USERNAME_PATTERN = /^[a-z0-9._-]{4,24}$/;

// Admin and scanner accounts, for the admin Settings page.
export function StaffProvider({ children }) {
  const signedIn = useSignedIn();
  const [staff, setStaff] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(tick);
  }, []);

  const refresh = usePolling(
    async () => {
      setStaff((await api.staff.list()).map(toStaff));
    },
    { enabled: signedIn }
  );

  /** Live status of one staff member: active, where, on what device, last seen. */
  const getActivity = (uid) => {
    const member = staff.find((s) => s.uid === uid);
    if (!member?.lastSeen) return { active: false, lastSeen: null };
    return { ...member, active: Boolean(member.online) && now - member.lastSeen < ACTIVE_WINDOW_MS };
  };

  // A new admin or scanner, entered on the same form as a student record. Their
  // ID number becomes the username they sign in with.
  const createStaff = async (fields, role) => {
    const id = (fields.studentId || "").trim().toLowerCase();
    if (!USERNAME_PATTERN.test(id)) {
      return { ok: false, message: "ID must be 4-24 letters, numbers, dots, dashes or underscores." };
    }
    try {
      const result = await api.staff.create({ ...fromStudent({ ...fields, studentId: id }), role });
      await refresh();
      return { ok: true, username: result.username, role: result.role, tempPassword: result.temp_password };
    } catch (error) {
      return { ok: false, message: error.data?.student_id ? "That ID is already used by another account." : error.message };
    }
  };

  // A forgotten or lost password: a new temporary one. They must choose their
  // own again the next time they sign in. (Your own password is changed under
  // My account instead.)
  const issuePassword = async (member) => {
    if (!member) return { ok: false, message: "Account not found." };
    try {
      const result = await api.users.issueAccount(member.username);
      await refresh();
      return { ok: true, username: member.username, tempPassword: result.temp_password };
    } catch (error) {
      return { ok: false, message: error.message || "Could not issue a new password." };
    }
  };

  const removeStaff = async (member) => {
    try {
      await api.users.remove(member.username);
      await refresh();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message || "Could not remove the account." };
    }
  };

  const dismissRequest = async (member) => {
    await api.users.dismissPasswordRequest(member.username);
    await refresh();
  };

  return (
    <StaffContext.Provider value={{ staff, getActivity, now, createStaff, issuePassword, removeStaff, dismissRequest }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return ctx;
}
