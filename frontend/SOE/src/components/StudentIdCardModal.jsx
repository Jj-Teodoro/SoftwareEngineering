import Modal from "./Modal";
import aces_logo from "../assets/aceslogo.png";

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
  if (!student) return null;

  const isActive = student.status === "ACTIVE";

  return (
    <Modal onClose={onClose} maxWidth="max-w-sm">
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
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-[#97191d] text-2xl font-bold text-white shadow-[0_0_20px_rgba(184,31,37,0.5)]">
            {initialsOf(student.name)}
          </div>
          <h3 className="mt-4 text-center text-base font-bold uppercase tracking-[2px] text-white">
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

        {/* Details */}
        <div className="mx-6 mb-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
          <DetailRow label="Student No." value={student.studentId} />
          <DetailRow label="Course" value={student.course} />
          <DetailRow label="Year Level" value={student.yearLevel} />
          <DetailRow label="Section" value={student.section} />
          <DetailRow label="Email" value={student.email} />
          <DetailRow label="Contact No." value={student.contactNumber} />
          <DetailRow label="Address" value={student.address} />
        </div>

        <div className="border-t border-white/10 px-6 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[2px] text-white/50">
            This ID remains the property of DYCI-CCS ACES
          </p>
        </div>
      </div>
    </Modal>
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
