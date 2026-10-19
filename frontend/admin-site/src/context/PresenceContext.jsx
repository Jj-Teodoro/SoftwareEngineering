import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePoints } from "./PointsContext";
import { useEvents } from "./EventsContext";
import { useStudents } from "./StudentsContext";

// A student's heartbeat arrives every 30s while they use the User site.
const ONLINE_WINDOW_MS = 90 * 1000;
// A scan-in with no scan-out counts as "at an event" for this long, so a
// forgotten scan-out can't keep someone Active forever.
const CHECKED_IN_WINDOW_MS = 16 * 60 * 60 * 1000;

const PresenceContext = createContext(null);

export function formatAgo(ms, now) {
  const seconds = Math.max(0, Math.round((now - ms) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function PresenceProvider({ children }) {
  const { getAttendanceRecords } = usePoints();
  const { events } = useEvents();
  const { students } = useStudents();
  const [now, setNow] = useState(() => Date.now());

  // heartbeats arrive with the student list (last_seen / online on each student)
  const presence = useMemo(
    () => Object.fromEntries(students.map((s) => [s.studentId, { online: s.online, lastSeen: s.lastSeen }])),
    [students]
  );

  // Re-evaluate every 15s so students flip to Inactive soon after their
  // heartbeats stop, without needing any new data to arrive.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const getActivity = (studentId) => {
    const p = presence[studentId];
    const online = Boolean(p?.online && p.lastSeen && now - p.lastSeen < ONLINE_WINDOW_MS);

    const openRecord = getAttendanceRecords(studentId).find(
      (r) => r.timeIn && !r.timeOut && now - Date.parse(r.timeIn) < CHECKED_IN_WINDOW_MS
    );
    const event = openRecord ? events.find((e) => e.id === openRecord.eventId) : null;

    return {
      active: online || Boolean(openRecord),
      online,
      atEvent: Boolean(openRecord),
      eventTitle: event?.title || null,
      lastSeen: p?.lastSeen ?? null,
    };
  };

  return (
    <PresenceContext.Provider value={{ getActivity, now }}>{children}</PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return ctx;
}
