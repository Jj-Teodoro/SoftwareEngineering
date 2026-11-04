// Event dates are stored as "YYYY-MM-DD" strings. "Today" must be the user's
// local calendar day (toISOString would give the UTC day, which is off by a day
// for several hours each morning in UTC+8).

export function todayLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "HH:MM" of the user's local clock, to compare with an event's start/end time.
export function clockLocal(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// "upcoming": time in hasn't opened yet (a later day, or before the start time today).
// "today": scanning is open. It opens at the start time and stays open, past the end
//   time and even past the event day, until an admin closes the event.
// "done": an admin closed the event; scanning has ended.
export function getEventPhase(event, today = todayLocal(), now = new Date()) {
  if (!event?.date) return "upcoming";
  if (event.closedAt) return "done";
  if (event.date > today) return "upcoming";
  if (event.date === today && event.startTime && clockLocal(now) < event.startTime) return "upcoming";
  return "today";
}

// "13:30" -> "1:30 PM"
export function formatClock(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// "8:00 AM – 5:00 PM", or "" for an event without times
export function formatEventTimes(event) {
  if (!event?.startTime && !event?.endTime) return "";
  if (event.startTime && event.endTime) return `${formatClock(event.startTime)} – ${formatClock(event.endTime)}`;
  return event.startTime ? `from ${formatClock(event.startTime)}` : `until ${formatClock(event.endTime)}`;
}

// The date, plus the times when the event has them: "Nov 5, 2026 · 8:00 AM – 5:00 PM"
export function formatEventWhen(event) {
  const times = formatEventTimes(event);
  return times ? `${formatEventDate(event.date)} · ${times}` : formatEventDate(event?.date);
}

// Time out (which earns the points) opens at the end time.
export function timeOutOpen(event, today = todayLocal(), now = new Date()) {
  if (!event?.endTime) return true;
  if (event.date < today) return true;
  return event.date === today && clockLocal(now) >= event.endTime;
}

export function daysUntil(dateStr, today = todayLocal()) {
  const toUtc = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(dateStr) - toUtc(today)) / 86400000);
}

export function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Short explanation shown wherever scanning is locked.
export function scanLockMessage(event, today = todayLocal()) {
  const phase = getEventPhase(event, today);
  if (phase === "today") return "";
  if (phase === "upcoming") {
    const at = event.startTime ? ` at ${formatClock(event.startTime)}` : "";
    if (event.date === today) return `Time in opens today${at}.`;
    const days = daysUntil(event.date, today);
    return `Time in opens on ${formatEventDate(event.date)}${at} (${days === 1 ? "tomorrow" : `in ${days} days`}).`;
  }
  return "This event has been closed, so scanning has ended.";
}
