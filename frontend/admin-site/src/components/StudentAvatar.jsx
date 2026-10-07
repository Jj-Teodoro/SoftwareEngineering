import { splitName } from "@oasis/shared/components/StudentIdCard.jsx";

export default function StudentAvatar({ student, size = 36 }) {
  const { first, last } = splitName(student.name);
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/60 bg-maroon/40 font-mono text-[11px] font-bold text-gold"
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
