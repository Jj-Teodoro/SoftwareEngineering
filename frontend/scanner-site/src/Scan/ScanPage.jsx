import { useState } from "react";
import { FiMonitor } from "react-icons/fi";
import { useEvents } from "../context/EventsContext";

export default function ScanPage({ onStartKiosk }) {
  const { events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState("");

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const isRestricted =
    selectedEvent?.programFilter && selectedEvent.programFilter !== "ALL";

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Scan</h2>

      <div className="rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <label className="mb-2 block text-xs font-bold uppercase tracking-[2px] text-white/70">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="h-12 w-full rounded-xl border border-white/30 bg-black/30 px-4 text-sm text-white outline-none focus:border-white/60"
        >
          <option className="text-black" value="">
            Choose an event...
          </option>
          {events.map((event) => (
            <option key={event.id} className="text-black" value={event.id}>
              {event.title} ({event.date})
            </option>
          ))}
        </select>

        {events.length === 0 && (
          <p className="mt-4 text-sm text-white/50">
            No events yet — create one from the Event tab first.
          </p>
        )}

        {selectedEvent && (
          <>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm font-bold text-white">{selectedEvent.title}</p>
              <p className="text-xs text-white/60">
                {selectedEvent.date} · {selectedEvent.pointValue} pts ·{" "}
                {isRestricted ? selectedEvent.programFilter : "All Programs"}
              </p>
            </div>

            <p className="mt-4 text-xs text-white/50">
              Kiosk Mode opens a private, student-facing check-in screen that only shows
              the scanning student's own name — no other tabs or event data are visible
              until an officer exits with the staff password.
            </p>

            <button
              type="button"
              onClick={() => onStartKiosk?.(selectedEvent.id)}
              className="mt-4 flex h-12 items-center gap-2 rounded-full bg-white/90 px-8 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
            >
              <FiMonitor size={16} />
              Launch Kiosk Mode
            </button>
          </>
        )}
      </div>
    </div>
  );
}
