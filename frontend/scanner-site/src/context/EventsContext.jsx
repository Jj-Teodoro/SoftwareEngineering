import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const EventsContext = createContext(null);

function attendanceDocId(eventId, studentId) {
  return `${eventId}_${studentId}`;
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [presentCounts, setPresentCounts] = useState({});

  useEffect(() => {
    let unsubscribeEvents = null;
    let unsubscribeAttendance = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeEvents) {
        unsubscribeEvents();
        unsubscribeEvents = null;
      }
      if (unsubscribeAttendance) {
        unsubscribeAttendance();
        unsubscribeAttendance = null;
      }
      if (!user) {
        setEvents([]);
        setPresentCounts({});
        return;
      }
      const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
      unsubscribeEvents = onSnapshot(q, (snapshot) => {
        setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      unsubscribeAttendance = onSnapshot(collection(db, "attendance"), (snapshot) => {
        const counts = {};
        snapshot.forEach((d) => {
          const eventId = d.data().eventId;
          if (!eventId) return;
          counts[eventId] = (counts[eventId] || 0) + 1;
        });
        setPresentCounts(counts);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeAttendance) unsubscribeAttendance();
    };
  }, []);

  const createEvent = async ({ title, date, description, pointValue, programFilter }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return { ok: false, message: "Event name is required." };
    }
    const ref = await addDoc(collection(db, "events"), {
      title: trimmedTitle,
      date,
      description: description?.trim() || "",
      pointValue: Number(pointValue) || 0,
      programFilter: programFilter || "ALL",
      createdBy: auth.currentUser?.uid || null,
      createdAt: serverTimestamp(),
    });
    return { ok: true, event: { id: ref.id } };
  };

  const deleteEvent = async (eventId) => {
    const attendanceSnap = await getDocs(
      query(collection(db, "attendance"), where("eventId", "==", eventId))
    );
    const batch = writeBatch(db);
    attendanceSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "events", eventId));
    await batch.commit();
  };

  return (
    <EventsContext.Provider value={{ events, presentCounts, createEvent, deleteEvent }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return ctx;
}

/**
 * Single-scan check-in/check-out for one student at one event, without
 * subscribing to the rest of the roster (used by the Kiosk, which should
 * never hold other students' data in memory).
 */
export async function scanEventAttendance(eventId, studentId) {
  const ref = doc(db, "attendance", attendanceDocId(eventId, studentId));
  const snap = await getDoc(ref);
  const now = new Date().toISOString();

  if (!snap.exists()) {
    const eventSnap = await getDoc(doc(db, "events", eventId));
    const pointValue = eventSnap.exists() ? eventSnap.data().pointValue || 0 : 0;
    const record = { eventId, studentId, pointValue, timeIn: now, timeOut: null };
    await setDoc(ref, record);
    return { action: "in", record };
  }

  const existing = snap.data();
  if (!existing.timeOut) {
    const record = { ...existing, timeOut: now };
    await setDoc(ref, record);
    return { action: "out", record };
  }

  return { action: "already", record: existing };
}
