import {
  FiAward,
  FiCalendar,
  FiMonitor,
  FiPlus,
  FiUpload,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
} from "react-icons/fi";
import { EmptyState, PageHeader, Section } from "@oasis/shared/components/ui.jsx";
import { todayLocal } from "@oasis/shared/utils/events.js";
import { useStudents } from "../context/StudentsContext";
import { useEvents } from "../context/EventsContext";
import { usePoints } from "../context/PointsContext";
import { usePresence } from "../context/PresenceContext";

const QUICK_ACTIONS = [
  { to: "Event", label: "New event", icon: FiPlus },
  { to: "Scan", label: "Launch scan", icon: FiMonitor },
  { to: "User", label: "Add student", icon: FiUserPlus },
  { to: "Import", label: "Import", icon: FiUpload },
];

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="surface flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-2xl font-bold leading-none">{value}</p>
        <p className="label mt-1.5 truncate">{label}</p>
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
  const upcomingEvents = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const usersStatus = [...students].sort((a, b) => getTotalPoints(a.studentId) - getTotalPoints(b.studentId));

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
        <Section title="Upcoming events" action={viewAll("Event")} className="xl:col-span-2">
          {upcomingEvents.length === 0 ? (
            <EmptyState>No upcoming events.</EmptyState>
          ) : (
            <ul className="space-y-3">
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
        </Section>

        <Section
          title="Clearance status"
          action={viewAll("User")}
          className="xl:col-span-3"
        >
          <p className="mb-3 text-xs muted">
            Each student's target is every requirement and event that applies to their program.
          </p>
          {usersStatus.length === 0 ? (
            <EmptyState>No students yet.</EmptyState>
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
    </div>
  );
}
