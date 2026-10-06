// Event dates are stored as "YYYY-MM-DD" strings. "Today" must be the user's
// local calendar day (toISOString would give the UTC day, which is off by a day
// for several hours each morning in UTC+8).

export function todayLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "upcoming": scheduled for a later day, scanning not open yet.
// "today": the event day, scanning is open.
// "done": the date has passed, scanning is closed.
export function getEventPhase(event, today = todayLocal()) {
  if (!event?.date) return "upcoming";
  if (event.date > today) return "upcoming";
  if (event.date < today) return "done";
  return "today";
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
    const days = daysUntil(event.date, today);
    return `Scanning opens on ${formatEventDate(event.date)} (${
      days === 1 ? "tomorrow" : `in ${days} days`
    }).`;
  }
  return `This event ended on ${formatEventDate(event.date)}; scanning is closed.`;
}
