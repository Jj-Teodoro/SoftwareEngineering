import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { FiCalendar, FiLogIn, FiLogOut } from "react-icons/fi";
import { db } from "@oasis/shared/firebaseClient.js";
import { EmptyState, Section } from "@oasis/shared/components/ui.jsx";
import { formatAgo, usePresence } from "../context/PresenceContext";
import { useEvents } from "../context/EventsContext";
import { usePoints } from "../context/PointsContext";
import { useStudents } from "../context/StudentsContext";

const SHOWN = 8;
const FRESH_MS = 10 * 60 * 1000;

// icon + chip colour per kind of activity (literal class names for Tailwind)
const KINDS = {
  in: { icon: FiLogIn, tone: "bg-green-500/15 text-green-300" },
  out: { icon: FiLogOut, tone: "bg-neon-cyan/15 text-neon-cyan" },
  event: { icon: FiCalendar, tone: "bg-gold/15 text-gold" },
};

/**
 * Live feed of what just happened: students scanning in or out at events, and
 * new events created by the scanner team or other admins.
 */
export default function ActivityFeed() {
  const { events } = useEvents();
  const { students } = useStudents();
  const { attendanceRecords } = usePoints();
  const { now } = usePresence();
  const [staff, setStaff] = useState({});
  const [showAll, setShowAll] = useState(false);

  useEffect(
    () =>
      onSnapshot(
        collection(db, "staff"),
        (snap) => setStaff(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
        () => setStaff({})
      ),
    []
  );

  const items = useMemo(() => {
    const nameOf = Object.fromEntries(students.map((s) => [s.studentId, s.name]));
    const titleOf = Object.fromEntries(events.map((e) => [e.id, e.title]));
    const list = [];

    attendanceRecords.forEach((r) => {
      const who = nameOf[r.studentId] || r.studentId;
      const event = titleOf[r.eventId];
      if (!event) return;
      if (r.timeIn) list.push({ key: `in-${r.eventId}-${r.studentId}`, kind: "in", at: Date.parse(r.timeIn), who, event });
      if (r.timeOut) list.push({ key: `out-${r.eventId}-${r.studentId}`, kind: "out", at: Date.parse(r.timeOut), who, event });
    });

    events.forEach((e) => {
      const at = e.createdAt?.toMillis?.();
      if (!at) return;
      const creator = staff[e.createdBy];
      list.push({
        key: `event-${e.id}`,
        kind: "event",
        at,
        who: creator ? creator.name : "Someone",
        role: creator?.role,
        event: e.title,
      });
    });

    return list.filter((i) => Number.isFinite(i.at)).sort((a, b) => b.at - a.at);
  }, [attendanceRecords, events, students, staff]);

  const visible = showAll ? items.slice(0, 30) : items.slice(0, SHOWN);

  const sentence = (item) => {
    if (item.kind === "in") return <><b>{item.who}</b> scanned in at <b>{item.event}</b></>;
    if (item.kind === "out") return <><b>{item.who}</b> scanned out of <b>{item.event}</b></>;
    return (
      <>
        <b>{item.who}</b>
        {item.role && <span className="text-white/50"> ({item.role})</span>} created a new event: <b>{item.event}</b>
      </>
    );
  };

  return (
    <Section
      title="Recent activity"
      action={<span className="chip-green"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" /> Live</span>}
    >
      {items.length === 0 ? (
        <EmptyState>Nothing yet. Scans and new events show up here as they happen.</EmptyState>
      ) : (
        <>
          <ul className="divide-y divide-white/10">
            {visible.map((item) => {
              const { icon: Icon, tone } = KINDS[item.kind];
              const fresh = now - item.at < FRESH_MS;
              return (
                <li key={item.key} className="flex items-center gap-3 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                    <Icon size={16} />
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-white/80 [&_b]:font-semibold [&_b]:text-white">
                    {sentence(item)}
                  </p>
                  {fresh && <span className="chip-cyan hidden sm:inline-flex">New</span>}
                  <span className="shrink-0 font-mono text-xs text-white/45">{formatAgo(item.at, now)}</span>
                </li>
              );
            })}
          </ul>
          {items.length > SHOWN && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="btn-ghost btn-sm mt-3">
              {showAll ? "Show less" : `Show more (${Math.min(items.length, 30) - SHOWN})`}
            </button>
          )}
        </>
      )}
    </Section>
  );
}
