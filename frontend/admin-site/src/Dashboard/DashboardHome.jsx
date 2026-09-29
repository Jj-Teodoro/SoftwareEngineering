import { FiUsers, FiUserCheck, FiUserX, FiCalendar, FiCreditCard } from "react-icons/fi";
import { useStudents } from "../context/StudentsContext";
import { useRequirements } from "../context/RequirementsContext";
import { useAttendance } from "../context/AttendanceContext";

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
  const { items, isPaid, getStatus } = useRequirements();
  const { sheets } = useAttendance();

  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.status === "ACTIVE").length;
  const clearedCount = students.filter((s) => getStatus(s.studentId).cleared).length;
  const pendingCount = totalStudents - clearedCount;

  const duesProgress = items.map((item) => {
    const paidCount = students.filter((s) => isPaid(s.studentId, item)).length;
    const pct = totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;
    return { item, paidCount, pct };
  });

  const recentSheets = [...sheets]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 4);

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dues collection progress */}
        <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
              Dues Collection Progress
            </h3>
            <button
              type="button"
              onClick={() => onNavigate?.("Payments")}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-[1px] text-white/60 hover:text-white"
            >
              <FiCreditCard size={14} /> Manage
            </button>
          </div>
          {duesProgress.length === 0 ? (
            <p className="text-sm text-white/50">No requirements set up yet.</p>
          ) : (
            <div className="space-y-4">
              {duesProgress.map(({ item, paidCount, pct }) => (
                <div key={item}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white/80">
                    <span>{item}</span>
                    <span>
                      {paidCount}/{totalStudents} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-[#97191d] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attendance sheets */}
        <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[2px] text-white">
              Recent Attendance
            </h3>
            <button
              type="button"
              onClick={() => onNavigate?.("Attendance")}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-[1px] text-white/60 hover:text-white"
            >
              <FiCalendar size={14} /> View all
            </button>
          </div>
          {recentSheets.length === 0 ? (
            <p className="text-sm text-white/50">No attendance sheets yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSheets.map((sheet) => {
                const present = Object.keys(sheet.records).length;
                const pct =
                  totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
                return (
                  <div key={sheet.id}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white/80">
                      <span>
                        {sheet.title} <span className="text-white/40">· {sheet.date}</span>
                      </span>
                      <span>
                        {present}/{totalStudents} present
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
    </div>
  );
}
