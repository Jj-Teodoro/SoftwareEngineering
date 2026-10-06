import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { usePoints } from "./PointsContext";
import { useEvents } from "./EventsContext";

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
  const [presence, setPresence] = useState({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (!user) {
        setPresence({});
        return;
      }
      unsubscribeSnapshot = onSnapshot(
        collection(db, "presence"),
        (snapshot) => {
          const next = {};
          snapshot.forEach((d) => {
            const data = d.data();
            next[d.id] = {
              online: Boolean(data.online),
              lastSeen: data.lastSeen?.toMillis?.() ?? null,
            };
          });
          setPresence(next);
        },
        () => setPresence({})
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

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
