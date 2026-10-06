import { splitName } from "@oasis/shared/components/StudentIdCard.jsx";

export default function StudentAvatar({ student, size = 36 }) {
  const { first, last } = splitName(student.name);
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#f2b400]/70 bg-gradient-to-b from-[#7a1317] to-[#2b0a0c] text-[11px] font-bold text-white"
      style={{ width: size, height: size }}
    >
      {student.photo ? (
        <img src={student.photo} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
