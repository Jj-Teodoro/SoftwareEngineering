import { useState } from "react";
import { FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import { useAttendance } from "../context/AttendanceContext";
import { useStudents } from "../context/StudentsContext";
import CreateAttendanceSheetModal from "../components/CreateAttendanceSheetModal";
import AttendanceSheetView from "./AttendanceSheetView";

export default function EventsPage({ onStartKiosk }) {
  const { sheets, deleteSheet } = useAttendance();
  const { students } = useStudents();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState(null);

  const selectedSheet = sheets.find((s) => s.id === selectedSheetId);

  if (selectedSheet) {
    return (
      <AttendanceSheetView
        sheet={selectedSheet}
        onBack={() => setSelectedSheetId(null)}
        onStartKiosk={onStartKiosk}
      />
    );
  }

  const handleDelete = (sheet) => {
    const confirmed = window.confirm(
      `Delete attendance sheet "${sheet.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    deleteSheet(sheet.id);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">
          Attendance Sheets
        </h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex h-12 items-center gap-2 rounded-full bg-white/90 px-6 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
        >
          <FiPlus size={16} />
          New Sheet
        </button>
      </div>

      {sheets.length === 0 && (
        <div className="flex min-h-[200px] w-full items-center justify-center rounded-[24px] border border-white/20 bg-white/10 text-sm text-white/60 backdrop-blur-md">
          No attendance sheets yet. Create one to start taking attendance.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sheets.map((sheet) => {
          const presentCount = Object.keys(sheet.records).length;
          return (
            <div
              key={sheet.id}
              className="flex flex-col justify-between rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
              <div>
                <h3 className="text-base font-bold uppercase tracking-[1px] text-white">
                  {sheet.title}
                </h3>
                <p className="mt-1 text-xs text-white/60">{sheet.date}</p>
                {sheet.description && (
                  <p className="mt-2 text-sm text-white/70">{sheet.description}</p>
                )}
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-white/80">
                  <FiUsers size={16} />
                  {presentCount} / {students.length} present
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSheetId(sheet.id)}
                  className="h-10 flex-1 rounded-full bg-[#97191d] text-sm font-bold uppercase tracking-[1px] text-white transition-all hover:bg-[#b81f25]"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(sheet)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white transition-all hover:bg-red-500/20"
                  aria-label={`Delete ${sheet.title}`}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateAttendanceSheetModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(sheet) => setSelectedSheetId(sheet.id)}
        />
      )}
    </div>
  );
}
