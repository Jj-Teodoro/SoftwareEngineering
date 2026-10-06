import { useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@oasis/shared/firebaseClient.js";
import { useStudent } from "../context/StudentContext";

const HEARTBEAT_MS = 30000;

// Tells the admin site when this student is actively using the website:
// a heartbeat every 30s while the tab is visible. The admin treats a student
// as online only while heartbeats keep arriving.
export async function markOffline(studentId) {
  try {
    await setDoc(doc(db, "presence", studentId), { lastSeen: serverTimestamp(), online: false });
  } catch {
    // best effort; the admin side also times out on its own
  }
}

export default function PresenceTracker() {
  const { student } = useStudent();
  const studentId = student?.studentId;

  useEffect(() => {
    if (!studentId) return undefined;
    const ref = doc(db, "presence", studentId);

    const beat = () => {
      if (document.visibilityState === "visible") {
        setDoc(ref, { lastSeen: serverTimestamp(), online: true }).catch(() => {});
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
