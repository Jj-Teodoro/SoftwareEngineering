import { useState } from "react";
import { FiCheckCircle, FiPlus, FiXCircle } from "react-icons/fi";
import Modal from "./Modal";
import aces_logo from "../assets/aceslogo.png";
import { useRequirements } from "../context/RequirementsContext";
import { useAttendance } from "../context/AttendanceContext";

function initialsOf(name) {
  const letters = name
    .replace(/[.,]/g, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("");
  return letters.slice(0, 2).toUpperCase();
}

export default function StudentIdCardModal({ student, onClose }) {
  const [tab, setTab] = useState("info");

  if (!student) return null;

  const isActive = student.status === "ACTIVE";

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="overflow-hidden rounded-[20px] border border-white/20 bg-white/10 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#7a1317] px-5 py-4">
          <img src={aces_logo} alt="ACES Logo" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-white">
              Dr. Yanga's Colleges, Inc.
            </p>
            <p className="text-[10px] uppercase tracking-[1px] text-white/80">
              College of Computer Studies
            </p>
          </div>
        </div>

        {/* Photo + name */}
        <div className="flex flex-col items-center px-6 py-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-[#97191d] text-xl font-bold text-white shadow-[0_0_20px_rgba(184,31,37,0.5)]">
            {initialsOf(student.name)}
          </div>
          <h3 className="mt-3 text-center text-base font-bold uppercase tracking-[2px] text-white">
            {student.name}
          </h3>
          <span
            className={`mt-2 rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[2px] ${
              isActive
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {student.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="mx-6 mb-4 flex rounded-full border border-white/20 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setTab("info")}
            className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-[1px] transition-all ${
              tab === "info" ? "bg-[#97191d] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Info
          </button>
          <button
            type="button"
            onClick={() => setTab("status")}
            className={`flex-1 rounded-full py-2 text-xs font-bold uppercase tracking-[1px] transition-all ${
              tab === "status" ? "bg-[#97191d] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Status
          </button>
        </div>

        {tab === "info" ? (
          <div className="mx-6 mb-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
            <DetailRow label="Student No." value={student.studentId} />
            <DetailRow label="Course" value={student.course} />
            <DetailRow label="Year Level" value={student.yearLevel} />
            <DetailRow label="Section" value={student.section} />
            <DetailRow label="Email" value={student.email} />
            <DetailRow label="Contact No." value={student.contactNumber} />
            <DetailRow label="Address" value={student.address} />
          </div>
        ) : (
          <StudentStatusTab student={student} />
        )}

        <div className="border-t border-white/10 px-6 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[2px] text-white/50">
            This ID remains the property of DYCI-CCS ACES
          </p>
        </div>
      </div>
    </Modal>
  );
}

function StudentStatusTab({ student }) {
  const { items, addItem, isPaid, togglePaid, getStatus } = useRequirements();
  const { sheets } = useAttendance();
  const [newItem, setNewItem] = useState("");
  const [addError, setAddError] = useState("");

  const { paidCount, totalCount, cleared } = getStatus(student.studentId);

  const attended = sheets.filter((sheet) => sheet.records[student.studentId]);

  const handleAddItem = () => {
    const result = addItem(newItem);
    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    setNewItem("");
    setAddError("");
  };

  return (
    <div className="mx-6 mb-6 space-y-5">
      {/* Clearance summary */}
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          cleared
            ? "border-green-400/40 bg-green-500/15 text-green-200"
            : "border-yellow-400/40 bg-yellow-500/15 text-yellow-200"
        }`}
      >
        {cleared ? <FiCheckCircle size={20} /> : <FiXCircle size={20} />}
        <div>
          <p className="text-sm font-bold uppercase tracking-[1px]">
            {cleared ? "Cleared" : "Pending Requirements"}
          </p>
          <p className="text-xs opacity-80">
            {paidCount} of {totalCount} requirements settled
          </p>
        </div>
      </div>

      {/* Requirements */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/70">
          Requirements &amp; Dues
        </p>
        <div className="space-y-2">
          {items.map((item) => {
            const paid = isPaid(student.studentId, item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => togglePaid(student.studentId, item)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-all ${
                  paid
                    ? "border-green-400/40 bg-green-500/10 text-green-200"
                    : "border-white/20 bg-black/20 text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{item}</span>
                <span className="text-xs font-bold uppercase tracking-[1px]">
                  {paid ? "Paid" : "Unpaid"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => {
              setNewItem(e.target.value);
              setAddError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddItem();
              }
            }}
            placeholder="Add requirement (e.g. Membership Fee)"
            className="h-10 flex-1 rounded-lg border border-white/20 bg-black/20 px-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/50"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20"
            aria-label="Add requirement"
          >
            <FiPlus size={16} />
          </button>
        </div>
        {addError && <p className="mt-1 text-xs font-semibold text-red-300">{addError}</p>}
      </div>

      {/* Attendance history */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[1px] text-white/70">
          Attendance History
        </p>
        {attended.length === 0 ? (
          <p className="text-sm text-white/50">No attendance records yet.</p>
        ) : (
          <div className="space-y-2">
            {attended.map((sheet) => (
              <div
                key={sheet.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{sheet.title}</p>
                  <p className="text-xs text-white/50">{sheet.date}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[1px] text-green-300">
                  Present
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-[1px] text-white/50">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words text-right text-sm text-white">
        {value}
      </span>
    </div>
  );
}
