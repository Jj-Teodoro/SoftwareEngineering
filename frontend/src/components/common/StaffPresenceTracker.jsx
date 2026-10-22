import { useEffect } from "react";
import { api } from "../../api/client";
import { describeDevice } from "../../utils/device";

/*
 * Lets the admin see who is using the admin and scanner portals and where.
 * Each signed-in staff member sends a heartbeat; pages and the kiosk tell the
 * tracker where they are with `useReportLocation`.
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
    const device = describeDevice();

    const write = (online = true) => {
      api.heartbeat(online, { app, page: where.page || "", event: where.event || "", device }).catch(() => {});
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
  }, [user?.uid, app]);

  return null;
}
