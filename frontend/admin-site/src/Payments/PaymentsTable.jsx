import { FiCheck, FiX } from "react-icons/fi";
import { useRequirements } from "../context/RequirementsContext";

export default function PaymentsTable({ students }) {
  const { items, isPaid, togglePaid, getStatus } = useRequirements();

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="bg-[#7a1317]/70">
              <th className="px-6 py-3 text-sm font-bold uppercase tracking-[2px] text-white">
                Student
              </th>
              <th className="px-6 py-3 text-sm font-bold uppercase tracking-[2px] text-white">
                Section
              </th>
              {items.map((item) => (
                <th
                  key={item}
                  className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[1px] text-white"
                >
                  {item}
                </th>
              ))}
              <th className="px-6 py-3 text-center text-sm font-bold uppercase tracking-[2px] text-white">
                Cleared
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={items.length + 3}
                  className="px-6 py-10 text-center text-sm text-white/60"
                >
                  No students found.
                </td>
              </tr>
            )}
            {students.map((student, i) => {
              const { cleared } = getStatus(student.studentId);
              return (
                <tr
                  key={student.studentId}
                  className={`border-b border-dashed border-white/20 last:border-none ${
                    i % 2 === 0 ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <td className="px-6 py-3">
                    <p className="text-sm font-semibold text-white">{student.name}</p>
                    <p className="text-xs text-white/50">{student.studentId}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-white/80">{student.section}</td>
                  {items.map((item) => {
                    const paid = isPaid(student.studentId, item);
                    return (
                      <td key={item} className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePaid(student.studentId, item)}
                          aria-label={`Toggle ${item} for ${student.name}`}
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
                            paid
                              ? "border-green-400/40 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                              : "border-white/20 bg-black/20 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          {paid ? <FiCheck size={16} /> : <FiX size={16} />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[1px] ${
                        cleared
                          ? "bg-green-500/20 text-green-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {cleared ? "Cleared" : "Pending"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
