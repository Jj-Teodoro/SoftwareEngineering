import { createContext, useContext, useState } from "react";
import { api } from "../../api/client.js";
import { useSignedIn, usePolling } from "../../api/hooks.js";
import { fromEvent, toAttendance, toEvent } from "../../api/mappers.js";
import { formatEventDate, getEventPhase } from "../../utils/events.js";

const EventsContext = createContext(null);

// How often the per-event roster refreshes while an admin is watching it.
const ROSTER_POLL_MS = 3000;

function validateEvent({ title, date, description, image }) {
  if (!(title || "").trim()) return "Event name is required.";
  if (!date) return "Date is required.";
  if (!(description || "").trim() && !image) {
    return "Add a description or a background picture. Students receive it in their notification.";
  }
  return null;
}

function cleanEvent(fields) {
  return {
    ...fields,
    title: fields.title.trim(),
    description: (fields.description || "").trim(),
    programFilter: fields.programFilter || "ALL",
  };
}

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

  // Posts an announcement for the students in the event's program. `kind` is
  // "new", "update" or "reminder"; each one shows up as a fresh unread
  // notification, even for students who already read an earlier one.
  const announce = async (event, kind) => {
    const label = kind === "reminder" ? "Reminder" : kind === "update" ? "Updated" : "New event";
    await api.events.announce(event.id, kind, `${label}: ${event.title} on ${formatEventDate(event.date)}`);
  };

  // An event needs a description or a background picture because that is what
  // students receive in their notification. Creating it also notifies the
  // students in its program (events dated in the past are not announced).
  const createEvent = async (fields) => {
    const problem = validateEvent(fields);
    if (problem) return { ok: false, message: problem };

    const eventData = cleanEvent(fields);
    let created;
    try {
      created = toEvent(await api.events.create(fromEvent(eventData)));
    } catch (error) {
      return { ok: false, message: error.message };
    }

    let notified = true;
    if (getEventPhase(created) !== "done") {
      try {
        await announce(created, "new");
      } catch {
        notified = false;
      }
    }
    await refresh();
    return { ok: true, event: { id: created.id }, notified };
  };

  const notifyEvent = async (eventId, kind = "reminder") => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return { ok: false, message: "Event not found." };
    if (getEventPhase(event) === "done") {
      return { ok: false, message: "This event is over, so there is nobody left to remind." };
    }
    try {
      await announce(event, kind);
    } catch {
      return { ok: false, message: "Could not send the notification." };
    }
    await refresh();
    return { ok: true };
  };

  const updateEvent = async (eventId, { notify, ...fields }) => {
    const problem = validateEvent(fields);
    if (problem) return { ok: false, message: problem };

    const changes = cleanEvent(fields);
    try {
      await api.events.update(eventId, fromEvent(changes));
    } catch (error) {
      return { ok: false, message: error.message };
    }

    let notified = true;
    if (notify && getEventPhase(changes) !== "done") {
      try {
        await announce({ id: eventId, ...changes }, "update");
      } catch {
        notified = false;
      }
    }
    await refresh();
    return { ok: true, event: { id: eventId }, notified };
  };

  // The server removes the event's attendance and notifications with it.
  const deleteEvent = async (eventId) => {
    await api.events.remove(eventId);
    await refresh();
  };

  return (
    <EventsContext.Provider value={{ events, presentCounts, createEvent, updateEvent, notifyEvent, deleteEvent }}>
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
 * Attendance roster for a single event, refreshed every few seconds. Used by the
 * admin's full roster view, which legitimately needs to see everyone's status.
 */
export function useEventAttendance(eventId) {
  const [records, setRecords] = useState({});

  const refresh = usePolling(
    async () => {
      const list = await api.attendance.list({ event: eventId });
      setRecords(Object.fromEntries(list.map((r) => [r.user, toAttendance(r)])));
    },
    { interval: ROSTER_POLL_MS, enabled: Boolean(eventId) }
  );

  const markPresent = async (studentId) => {
    await api.attendance.create({ event: eventId, user: studentId });
    await refresh();
  };

  const markOut = async (studentId) => {
    const existing = records[studentId];
    if (!existing) return;
    await api.attendance.update(existing.id, { time_out: new Date().toISOString() });
    await refresh();
  };

  const unmarkPresent = async (studentId) => {
    const existing = records[studentId];
    if (!existing) return;
    await api.attendance.remove(existing.id);
    await refresh();
  };

  return { records, markPresent, markOut, unmarkPresent };
}

/**
 * Single-scan check-in/check-out for one student at one event, without
 * loading the rest of the roster (used by the admin's quick-scan box and by
 * the private student Kiosk, which should never hold other students' data).
 */
export async function scanEventAttendance(eventId, studentId) {
  const { action, record } = await api.attendance.scan(eventId, studentId);
  return { action, record: toAttendance(record) };
}
