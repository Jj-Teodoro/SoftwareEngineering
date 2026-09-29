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

export default function DashboardHome({ onNavigate }) {
  const { students } = useStudents();
  const { events, presentCounts } = useEvents();
  const { getTotalPoints, getClearance, targetPoints } = usePoints();

  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.status === "ACTIVE").length;
  const clearedCount = students.filter((s) => getClearance(s.studentId).cleared).length;
  const pendingCount = totalStudents - clearedCount;

  const mostBehind = [...students]
    .sort((a, b) => getTotalPoints(a.studentId) - getTotalPoints(b.studentId))
    .slice(0, 5);

  const recentEvents = [...events].slice(0, 6);

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Dashboard</h2>

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
          label="Active Students"
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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Points status */}
        <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
              Points Status
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
          {mostBehind.length === 0 ? (
            <p className="text-sm text-white/50">No students yet.</p>
          ) : (
            <div className="space-y-4">
              {mostBehind.map((student) => {
                const points = getTotalPoints(student.studentId);
                const pct =
                  targetPoints > 0 ? Math.min(100, Math.round((points / targetPoints) * 100)) : 0;
                return (
                  <div key={student.studentId}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white/80">
                      <span className="truncate">{student.name}</span>
                      <span>
                        {points}/{targetPoints} pts
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-[#97191d] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
              Recent Events
            </h3>
            <button
              type="button"
              onClick={() => onNavigate?.("Event")}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-[1px] text-white/60 hover:text-white"
            >
              <FiCalendar size={14} /> View all
            </button>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-white/50">No events yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => {
                const isRestricted = event.programFilter && event.programFilter !== "ALL";
                const eligibleCount = isRestricted
                  ? students.filter((s) => s.course === event.programFilter).length
                  : totalStudents;
                const present = presentCounts[event.id] ?? 0;
                const pct = eligibleCount > 0 ? Math.round((present / eligibleCount) * 100) : 0;
                return (
                  <div key={event.id}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white/80">
                      <span>
                        {event.title} <span className="text-white/40">· {event.date}</span>
                      </span>
                      <span>
                        {present}/{eligibleCount} present
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-green-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[2px] text-white">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => onNavigate?.("Event")}
            className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-4 text-left text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiPlus size={18} /> New Event
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("Scan")}
            className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-4 text-left text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiMonitor size={18} /> Launch Scan
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("User")}
            className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-4 text-left text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiUserPlus size={18} /> Add Student
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("Import")}
            className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-4 text-left text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-white/15"
          >
            <FiUpload size={18} /> Import Students
          </button>
        </div>
      </div>
    </div>
  );
}
