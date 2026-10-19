import { useEffect } from "react";
import { api } from "@oasis/shared/api/client.js";
import { useStudent } from "../context/StudentContext";

const HEARTBEAT_MS = 30000;

// Tells the admin site when this student is actively using the website:
// a heartbeat every 30s while the tab is visible. The admin treats a student
// as online only while heartbeats keep arriving.
export async function markOffline() {
  try {
    await api.heartbeat(false);
  } catch {
    // best effort; the admin side also times out on its own
  }
}

export default function PresenceTracker() {
  const { student } = useStudent();
  const studentId = student?.studentId;

  useEffect(() => {
    if (!studentId) return undefined;

    const beat = () => {
      if (document.visibilityState === "visible") {
        api.heartbeat(true).catch(() => {});
      }
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [studentId]);

  return null;
}
