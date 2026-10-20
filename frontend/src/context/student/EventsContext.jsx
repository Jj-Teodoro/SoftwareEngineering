import { createContext, useContext, useState } from "react";
import { api } from "../../api/client.js";
import { usePolling } from "../../api/hooks.js";
import { toAttendance, toEvent } from "../../api/mappers.js";
import { todayLocal } from "../../utils/events.js";
import { useStudent } from "./StudentContext";

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const { student } = useStudent();
  const [events, setEvents] = useState([]);
  const [myAttendance, setMyAttendance] = useState({});

  // the server only returns this student's own attendance
  usePolling(
    async () => {
      const [eventList, attendance] = await Promise.all([api.events.list(), api.attendance.list()]);
      setEvents(eventList.map(toEvent).sort((a, b) => a.date.localeCompare(b.date)));
      setMyAttendance(Object.fromEntries(attendance.map((r) => [r.event, toAttendance(r)])));
    },
    { enabled: Boolean(student) }
  );

  const myEvents = events.filter(
    (e) => !e.programFilter || e.programFilter === "ALL" || e.programFilter === student?.course
  );

  const today = todayLocal();
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
