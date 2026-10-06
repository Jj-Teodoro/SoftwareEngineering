import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiAward,
  FiPlus,
  FiMonitor,
  FiUserPlus,
  FiUpload,
} from "react-icons/fi";
import { useStudents } from "../context/StudentsContext";
import { useEvents } from "../context/EventsContext";
import { usePoints } from "../context/PointsContext";
import { usePresence } from "../context/PresenceContext";
import { todayLocal } from "@oasis/shared/utils/events.js";

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-white/20 bg-white/10 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs font-bold uppercase tracking-[1px] text-white/60">{label}</p>
      </div>
    </div>
  );
}

function SegmentedBar({ points, target, cleared, segments = 10 }) {
  const filled =
    target > 0 ? Math.round((Math.min(points, target) / target) * segments) : 0;
  return (
    <div className="flex gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-sm border ${
            i < filled
              ? cleared
                ? "border-green-500 bg-green-500"
                : "border-[#e23b3b] bg-[#e23b3b]"
              : "border-white/30 bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

export default function DashboardHome({ onNavigate }) {
  const { students } = useStudents();
  const { events, presentCounts } = useEvents();
  const { getTotalPoints, getClearance, targetPoints } = usePoints();
  const { getActivity } = usePresence();

  const totalStudents = students.length;
  const activeCount = students.filter((s) => getActivity(s.studentId).active).length;
  const clearedCount = students.filter((s) => getClearance(s.studentId).cleared).length;
  const pendingCount = totalStudents - clearedCount;

  const today = todayLocal();
  const upcomingEvents = [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const usersStatus = [...students].sort(
    (a, b) => getTotalPoints(a.studentId) - getTotalPoints(b.studentId)
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Dashboard</h2>

      {/* Quick actions */}
      <div className="rounded-[20px] border border-white/20 bg-white/10 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-white/70">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onNavigate?.("Event")}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiPlus size={14} /> New Event
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("Scan")}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiMonitor size={14} /> Launch Scan
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("User")}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiUserPlus size={14} /> Add Student
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("Import")}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiUpload size={14} /> Import
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FiUsers className="text-white" size={20} />}
          label="Total Students"
          value={totalStudents}
          accent="bg-[#97191d]"
        />
        <StatCard
          icon={<FiUserCheck className="text-white" size={20} />}
          label="Active Now"
          value={activeCount}
          accent="bg-green-600"
        />
        <StatCard
          icon={<FiUserCheck className="text-white" size={20} />}
          label="Cleared"
          value={clearedCount}
          accent="bg-emerald-700"
        />
        <StatCard
          icon={<FiUserX className="text-white" size={20} />}
          label="Pending Clearance"
          value={pendingCount}
          accent="bg-yellow-600"
        />
      </div>

      {/* Upcoming events */}
      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
            Upcoming Events
          </h3>
          <button
            type="button"
            onClick={() => onNavigate?.("Event")}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-[1px] text-white/60 hover:text-white"
          >
            <FiCalendar size={14} /> View all
          </button>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-white/50">No upcoming events.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => {
              const isRestricted = event.programFilter && event.programFilter !== "ALL";
              const eligibleCount = isRestricted
                ? students.filter((s) => s.course === event.programFilter).length
                : totalStudents;
              const present = presentCounts[event.id] ?? 0;
              return (
                <div
                  key={event.id}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-white">{event.title}</p>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#97191d]/30 px-2 py-0.5 text-[10px] font-bold text-white">
                      <FiAward size={10} /> {event.pointValue} pts
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">{event.date}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {present}/{eligibleCount} present ·{" "}
                    {isRestricted ? event.programFilter : "All Programs"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Users status */}
      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
            Users Status
          </h3>
          <button
            type="button"
            onClick={() => onNavigate?.("User")}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-[1px] text-white/60 hover:text-white"
          >
            <FiAward size={14} /> View all
          </button>
        </div>
        <p className="mb-4 text-xs text-white/50">
          Semester target: <span className="font-bold text-white">{targetPoints} pts</span>
        </p>
        {usersStatus.length === 0 ? (
          <p className="text-sm text-white/50">No students yet.</p>
        ) : (
          <div className="space-y-4">
            {usersStatus.map((student) => {
              const points = getTotalPoints(student.studentId);
              const cleared = getClearance(student.studentId).cleared;
              return (
                <div
                  key={student.studentId}
                  className="flex flex-col gap-2 border-b border-white/10 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 sm:w-1/3">
                    <p className="truncate text-sm font-bold uppercase tracking-[1px] text-white">
                      {student.name}
                    </p>
                    <p className="text-xs text-white/50">{student.studentId}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-xs font-semibold text-white/80">
                      {points}/{targetPoints} points
                      {cleared && <span className="ml-1 text-green-400">· Cleared</span>}
                    </span>
                    <SegmentedBar points={points} target={targetPoints} cleared={cleared} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
