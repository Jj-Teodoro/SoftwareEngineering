import { FiAward, FiCalendar, FiCode, FiMic, FiUsers } from "react-icons/fi";
import { programTheme } from "./StudentIdCard.jsx";

/**
 * The banner on top of an event card or a notification. An uploaded picture is shown cropped to
 * fit with a soft shade and the date badge; without one, a designed banner is drawn from the
 * event itself: the colors of its program, an icon that suits its name, and the date.
 */

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// the first rule that matches the event name picks the icon
const TOPICS = [
  [/hack|code|coding|tech|develop|robot|cyber|data|\bai\b|program|web/i, FiCode],
  [/talk|seminar|webinar|speaker|forum|summit|conference|workshop|training/i, FiMic],
  [/intramural|sport|game|tournament|league|fun run|camp|fest/i, FiAward],
  [/assembly|orientation|meeting|induction|general|gathering|social|party|night/i, FiUsers],
];
const iconFor = (title = "") => (TOPICS.find(([re]) => re.test(title)) || [null, FiCalendar])[1];

export default function EventBanner({ event, height = "h-32" }) {
  const restricted = event.programFilter && event.programFilter !== "ALL";
  const theme = programTheme(restricted ? event.programFilter : "");
  const Icon = iconFor(event.title);
  const [, month, day] = (event.date || "").split("-");

  return (
    <div
      className={`relative w-full overflow-hidden ${height}`}
      style={{ background: `linear-gradient(135deg, ${theme.bg[0]}, ${theme.bg[2]})` }}
    >
      {event.image ? (
        <>
          <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div
            className="absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-25 blur-2xl"
            style={{ background: theme.accent }}
          />
          <Icon className="absolute right-5 top-1/2 -translate-y-1/2 text-white opacity-[0.16]" size={84} aria-hidden="true" />
        </>
      )}

      {month && day && (
        <div className="absolute left-3 top-3 flex w-12 flex-col items-center rounded-lg bg-white/95 py-1 text-[#1a0a0b] shadow">
          <span className="text-[9px] font-extrabold leading-none tracking-wider" style={{ color: theme.deep }}>
            {MONTHS[Number(month) - 1]}
          </span>
          <span className="text-lg font-extrabold leading-tight">{Number(day)}</span>
        </div>
      )}

    </div>
  );
}
