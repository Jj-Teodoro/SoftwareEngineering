import { createContext, useContext, useState } from "react";
import { api } from "@oasis/shared/api/client.js";
import { useSignedIn, usePolling } from "@oasis/shared/api/hooks.js";
import { fromEvent, toAttendance, toEvent } from "@oasis/shared/api/mappers.js";
import { formatEventDate, getEventPhase } from "@oasis/shared/utils/events.js";

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const signedIn = useSignedIn();
  const [events, setEvents] = useState([]);
  const [presentCounts, setPresentCounts] = useState({});

  const refresh = usePolling(
    async () => {
      const [eventList, attendance] = await Promise.all([api.events.list(), api.attendance.list()]);
      setEvents(eventList.map(toEvent));
      const counts = {};
      attendance.forEach((record) => {
        counts[record.event] = (counts[record.event] || 0) + 1;
      });
      setPresentCounts(counts);
    },
    { enabled: signedIn }
  );

  // An event needs a description or a background picture because that is what
  // students receive in their notification. Creating it also notifies the
  // students in its program (events dated in the past are not announced).
  const createEvent = async ({
    title,
    date,
    description,
    image,
    pointValue,
    programFilter,
  }) => {
    const trimmedTitle = (title || "").trim();
    const trimmedDescription = (description || "").trim();
    if (!trimmedTitle) {
      return { ok: false, message: "Event name is required." };
    }
    if (!date) {
      return { ok: false, message: "Date is required." };
    }
    if (!trimmedDescription && !image) {
      return {
        ok: false,
        message: "Add a description or a background picture. Students receive it in their notification.",
      };
    }

    let created;
    try {
      created = toEvent(
        await api.events.create(
          fromEvent({ title: trimmedTitle, date, description: trimmedDescription, image, pointValue, programFilter })
        )
      );
    } catch (error) {
      return { ok: false, message: error.message };
    }

    let notified = true;
    if (getEventPhase(created) !== "done") {
      try {
        await api.events.announce(created.id, "new", `New event on ${formatEventDate(date)}`);
      } catch {
        notified = false;
      }
    }
    await refresh();
    return { ok: true, event: { id: created.id }, notified };
  };

  // The server removes the event's attendance and notifications with it.
  const deleteEvent = async (eventId) => {
    await api.events.remove(eventId);
    await refresh();
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
 * loading the rest of the roster (used by the Kiosk, which should
 * never hold other students' data in memory).
 */
export async function scanEventAttendance(eventId, studentId) {
  const { action, record } = await api.attendance.scan(eventId, studentId);
  return { action, record: toAttendance(record) };
}
