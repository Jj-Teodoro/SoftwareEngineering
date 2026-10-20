import { useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseClient.js";
import { describeDevice } from "../utils/device.js";

/*
 * Lets the admin see who is using the admin and scanner sites and where.
 * Each signed-in staff member writes one small heartbeat document; pages and
 * the kiosk tell the tracker where they are with `useReportLocation`.
 */

const HEARTBEAT_MS = 30000;

let where = { page: "", event: "" };
const listeners = new Set();

function reportLocation(next) {
  where = { ...where, ...next };
  listeners.forEach((fn) => fn());
}

/** Call from a page (or the kiosk) to say where this staff member is. */
export function useReportLocation(page, event = "") {
  useEffect(() => {
    reportLocation({ page, event });
  }, [page, event]);
}

export default function StaffPresenceTracker({ user, app }) {
  useEffect(() => {
    if (!user?.uid) return undefined;
    const ref = doc(db, "staffPresence", user.uid);
    const device = describeDevice();

    const write = (online = true) => {
      if (!auth.currentUser) return;
      setDoc(ref, {
        lastSeen: serverTimestamp(),
        online,
        app,
        page: where.page || "",
        event: where.event || "",
        device,
        username: user.username || "",
        name: user.name || "",
        role: user.role || "",
      }).catch(() => {});
    };

    write();
    const timer = setInterval(write, HEARTBEAT_MS);
    listeners.add(write);
    const goOffline = () => write(false);
    window.addEventListener("pagehide", goOffline);

    return () => {
      clearInterval(timer);
      listeners.delete(write);
      window.removeEventListener("pagehide", goOffline);
      write(false);
    };
  }, [user?.uid, user?.username, user?.name, user?.role, app]);

  return null;
}
