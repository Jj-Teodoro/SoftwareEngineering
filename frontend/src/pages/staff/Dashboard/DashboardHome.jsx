import { useMemo, useState } from "react";
import {
  FiAward,
  FiCalendar,
  FiMonitor,
  FiPlus,
  FiSearch,
  FiUpload,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
} from "react-icons/fi";
import { EmptyState, PageHeader, Section } from "../../../components/common/ui.jsx";
import { todayLocal } from "../../../utils/events.js";
import { useStudents } from "../../../context/staff/StudentsContext";
import { useEvents } from "../../../context/staff/EventsContext";
import { usePoints } from "../../../context/staff/PointsContext";
import { usePresence } from "../../../context/staff/PresenceContext";
import ActivityFeed from "./ActivityFeed";
import { DirectionToggle, MiniSelect, sortBy } from "../../../components/common/SortControls.jsx";

const CLEARANCE_LIMIT = 10;

const STUDENT_SORTS = [
  { value: "points", label: "Points" },
  { value: "name", label: "Name" },
  { value: "studentId", label: "Student ID" },
];
const EVENT_SORTS = [
  { value: "date", label: "Date" },
  { value: "title", label: "Title" },
  { value: "points", label: "Points" },
];

// A search box for the compact toolbars on the dashboard cards.
function MiniSearch({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-[140px] flex-1">
      <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" size={12} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 py-1.5 pl-7 pr-2 text-xs text-white placeholder:text-white/35 focus:border-gold/60 focus:outline-none"
      />
    </div>
  );
}

const QUICK_ACTIONS = [
  { to: "Event", label: "New event", icon: FiPlus },
  { to: "Scan", label: "Launch scan", icon: FiMonitor },
  { to: "User", label: "Add student", icon: FiUserPlus },
  { to: "Import", label: "Import", icon: FiUpload },
];

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="surface flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      <div className={`flex h-10 w-10 shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-2xl font-bold leading-none">{value}</p>
        <p className="label mt-1.5 leading-snug">{label}</p>
      </div>
    </div>
  );
}

function PointsBar({ points, target, cleared }) {
  const pct = target > 0 ? Math.min(100, Math.round((points / target) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${cleared ? "bg-green-400" : "bg-gold"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardHome({ onNavigate }) {
  const { students } = useStudents();
  const { events, presentCounts } = useEvents();
  const { getTotalPoints, getClearance } = usePoints();
  const { getActivity } = usePresence();

  const clearedCount = students.filter((s) => getClearance(s.studentId).cleared).length;
  const activeCount = students.filter((s) => getActivity(s.studentId).active).length;

  const today = todayLocal();

  // filters and sorting for the two cards
  const [studentQuery, setStudentQuery] = useState("");
  const [studentProgram, setStudentProgram] = useState("ALL");
  const [studentClearance, setStudentClearance] = useState("ALL");
  const [studentSort, setStudentSort] = useState("points");
  const [studentDir, setStudentDir] = useState("asc");
  const [eventQuery, setEventQuery] = useState("");
  const [eventProgram, setEventProgram] = useState("ALL");
  const [eventSort, setEventSort] = useState("date");
  const [eventDir, setEventDir] = useState("asc");

  const studentPrograms = useMemo(() => [...new Set(students.map((s) => s.course).filter(Boolean))].sort(), [students]);
  const eventPrograms = useMemo(
    () => [...new Set(events.map((e) => e.programFilter).filter((p) => p && p !== "ALL"))].sort(),
    [events]
  );

  const upcomingEvents = useMemo(() => {
    const query = eventQuery.trim().toLowerCase();
    const list = events.filter((e) => {
      if (e.date < today) return false;
      if (query && !e.title.toLowerCase().includes(query)) return false;
      const program = e.programFilter && e.programFilter !== "ALL" ? e.programFilter : "ALL";
      return eventProgram === "ALL" || program === eventProgram || program === "ALL";
    });
    const valueOf = { date: (e) => e.date, title: (e) => e.title, points: (e) => Number(e.pointValue) || 0 }[eventSort];
    return sortBy(list, valueOf, eventDir);
  }, [events, today, eventQuery, eventProgram, eventSort, eventDir]);

  // the dashboard shows 10 students (by default the ones with the fewest points); "View all" has the rest
  const matchingStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    const list = students.filter((s) => {
      if (query && !s.name.toLowerCase().includes(query) && !s.studentId.toLowerCase().includes(query)) return false;
      if (studentProgram !== "ALL" && s.course !== studentProgram) return false;
      if (studentClearance !== "ALL") {
        const cleared = getClearance(s.studentId).cleared;
        if ((studentClearance === "CLEARED") !== cleared) return false;
      }
      return true;
    });
    const valueOf = {
      points: (s) => getTotalPoints(s.studentId),
      name: (s) => s.name,
      studentId: (s) => s.studentId,
    }[studentSort];
    return sortBy(list, valueOf, studentDir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, studentQuery, studentProgram, studentClearance, studentSort, studentDir, getTotalPoints, getClearance]);
  const usersStatus = matchingStudents.slice(0, CLEARANCE_LIMIT);

  const viewAll = (to) => (
    <button type="button" onClick={() => onNavigate?.(to)} className="label hover:text-white">
      View all →
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Dashboard" subtitle="Clearance progress and what's happening today.">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
          <button key={to} type="button" onClick={() => onNavigate?.(to)} className="btn-ghost btn-sm">
            <Icon size={14} /> {label}
          </button>
        ))}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total students" value={students.length} tone="bg-maroon/40 text-white" />
        <StatCard icon={FiUserCheck} label="Active now" value={activeCount} tone="bg-green-500/15 text-green-300" />
        <StatCard icon={FiAward} label="Cleared" value={clearedCount} tone="bg-neon-cyan/15 text-neon-cyan" />
        <StatCard icon={FiUserX} label="Pending" value={students.length - clearedCount} tone="bg-yellow-500/15 text-yellow-300" />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* side by side, the events card is as tall as the clearance card and scrolls inside */}
        <Section
          title="Upcoming events"
          action={viewAll("Event")}
          className="flex flex-col xl:col-span-2"
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <MiniSearch value={eventQuery} onChange={setEventQuery} placeholder="Search events" />
            <MiniSelect
              label="Program"
              value={eventProgram}
              onChange={setEventProgram}
              options={[{ value: "ALL", label: "All programs" }, ...eventPrograms.map((p) => ({ value: p, label: p }))]}
            />
            <MiniSelect label="Sort events by" value={eventSort} onChange={setEventSort} options={EVENT_SORTS} />
            <DirectionToggle dir={eventDir} onChange={setEventDir} />
          </div>
          <div className="relative min-h-0 flex-1">
          {upcomingEvents.length === 0 ? (
            <EmptyState>{eventQuery || eventProgram !== "ALL" ? "No upcoming events match." : "No upcoming events."}</EmptyState>
          ) : (
            <ul className="max-h-[36rem] space-y-3 overflow-y-auto pr-1 xl:absolute xl:inset-0 xl:max-h-none">
              {upcomingEvents.map((event) => {
                const restricted = event.programFilter && event.programFilter !== "ALL";
                const eligible = restricted
                  ? students.filter((s) => s.course === event.programFilter).length
                  : students.length;
                return (
                  <li key={event.id} className="surface-inset flex items-start justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{event.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs muted">
                        <FiCalendar size={11} /> {event.date}
                      </p>
                      <p className="mt-0.5 text-xs text-white/50">
                        {presentCounts[event.id] ?? 0}/{eligible} present · {restricted ? event.programFilter : "All programs"}
                      </p>
                    </div>
                    <span className="chip-amber">{event.pointValue} pts</span>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
        </Section>

        <Section
          title="Clearance status"
          action={viewAll("User")}
          className="xl:col-span-3"
        >
          <p className="mb-3 text-xs muted">
            Each student's target is every requirement and event that applies to their program.
            {matchingStudents.length > CLEARANCE_LIMIT &&
              ` Showing ${CLEARANCE_LIMIT} of ${matchingStudents.length}${
                matchingStudents.length < students.length ? " matching" : ""
              } students.`}
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <MiniSearch value={studentQuery} onChange={setStudentQuery} placeholder="Search name or ID" />
            <MiniSelect
              label="Program"
              value={studentProgram}
              onChange={setStudentProgram}
              options={[{ value: "ALL", label: "All programs" }, ...studentPrograms.map((p) => ({ value: p, label: p }))]}
            />
            <MiniSelect
              label="Clearance"
              value={studentClearance}
              onChange={setStudentClearance}
              options={[
                { value: "ALL", label: "Any status" },
                { value: "CLEARED", label: "Cleared" },
                { value: "NOT CLEARED", label: "Not cleared" },
              ]}
            />
            <MiniSelect label="Sort students by" value={studentSort} onChange={setStudentSort} options={STUDENT_SORTS} />
            <DirectionToggle dir={studentDir} onChange={setStudentDir} />
          </div>
          {usersStatus.length === 0 ? (
            <EmptyState>{students.length === 0 ? "No students yet." : "No students match."}</EmptyState>
          ) : (
            <ul className="divide-y divide-white/10">
              {usersStatus.map((student) => {
                const points = getTotalPoints(student.studentId);
                const { cleared, targetPoints } = getClearance(student.studentId);
                return (
                  <li key={student.studentId} className="grid items-center gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[1fr_minmax(0,220px)]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{student.name}</p>
                      <p className="font-mono text-xs text-white/45">{student.studentId}</p>
                    </div>
                    <div>
                      <p className="mb-1 flex justify-between font-mono text-xs">
                        <span className="muted">{points}/{targetPoints} pts</span>
                        {cleared && <span className="text-green-300">Cleared</span>}
                      </p>
                      <PointsBar points={points} target={targetPoints} cleared={cleared} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      <ActivityFeed />
    </div>
  );
}
