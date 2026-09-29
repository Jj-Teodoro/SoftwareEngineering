import { useState } from "react";
import { FiPlus, FiTrash2, FiUsers, FiAward } from "react-icons/fi";
import { useEvents } from "../context/EventsContext";
import { useStudents } from "../context/StudentsContext";
import CreateEventModal from "../components/CreateEventModal";

export default function EventsPage() {
  const { events, presentCounts, deleteEvent } = useEvents();
  const { students } = useStudents();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (event) => {
    const confirmed = window.confirm(
      `Delete event "${event.title}"? This cannot be undone.`
    );
    if (!confirmed) return;
    await deleteEvent(event.id);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-[2px] text-white">Events</h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex h-12 items-center gap-2 rounded-full bg-white/90 px-6 text-sm font-bold uppercase tracking-[2px] text-[#7a1317] transition-all hover:bg-white"
        >
          <FiPlus size={16} />
          New Event
        </button>
      </div>

      {events.length === 0 && (
        <div className="flex min-h-[200px] w-full items-center justify-center rounded-[24px] border border-white/20 bg-white/10 text-sm text-white/60 backdrop-blur-md">
          No events yet. Create one to start scanning attendance.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const isRestricted = event.programFilter && event.programFilter !== "ALL";
          const eligibleCount = isRestricted
            ? students.filter((s) => s.course === event.programFilter).length
            : students.length;
          const presentCount = presentCounts[event.id] ?? 0;
          return (
            <div
              key={event.id}
              className="flex flex-col justify-between rounded-[24px] border border-white/20 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold uppercase tracking-[1px] text-white">
                    {event.title}
                  </h3>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#97191d]/30 px-3 py-1 text-xs font-bold text-white">
                    <FiAward size={12} /> {event.pointValue} pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/60">{event.date}</p>
                {event.description && (
                  <p className="mt-2 text-sm text-white/70">{event.description}</p>
                )}
                <p className="mt-2 text-xs font-bold uppercase tracking-[1px] text-white/50">
                  {isRestricted ? event.programFilter : "All Programs"}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                  <FiUsers size={16} />
                  {presentCount} / {eligibleCount} present
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(event)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/5 text-white transition-all hover:bg-red-500/20"
                  aria-label={`Delete ${event.title}`}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} onCreated={() => {}} />
      )}
    </div>
  );
}
