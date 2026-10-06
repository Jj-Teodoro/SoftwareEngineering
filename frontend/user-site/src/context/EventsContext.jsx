import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { useStudent } from "./StudentContext";

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const { student } = useStudent();
  const [events, setEvents] = useState([]);
  const [myAttendance, setMyAttendance] = useState({});

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (!user) {
        setEvents([]);
        return;
      }
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  useEffect(() => {
    if (!student) {
      setMyAttendance({});
      return;
    }
    const q = query(collection(db, "attendance"), where("studentId", "==", student.studentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next = {};
      snapshot.forEach((d) => {
        next[d.data().eventId] = d.data();
      });
      setMyAttendance(next);
    });
    return unsubscribe;
  }, [student?.studentId]);

  const myEvents = events.filter(
    (e) => !e.programFilter || e.programFilter === "ALL" || e.programFilter === student?.course
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = myEvents.filter((e) => e.date >= today && !myAttendance[e.id]);
  const attended = myEvents.filter((e) => myAttendance[e.id]);

  return (
    <EventsContext.Provider value={{ events: myEvents, myAttendance, upcoming, attended }}>
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
