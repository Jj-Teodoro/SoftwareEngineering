import { useState } from "react";
import EventsBoard from "@oasis/shared/components/EventsBoard.jsx";
import { useConfirm } from "@oasis/shared/components/ConfirmDialog.jsx";
import { useEvents } from "../context/EventsContext";
import { useStudents } from "../context/StudentsContext";
import CreateEventModal from "../components/CreateEventModal";
import EventDetailView from "./EventDetailView";

export default function EventsPage({ onStartKiosk }) {
  const { events, presentCounts, deleteEvent } = useEvents();
  const { students } = useStudents();
  const confirm = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  if (selectedEvent) {
    return (
      <EventDetailView event={selectedEvent} onBack={() => setSelectedEventId(null)} onStartKiosk={onStartKiosk} />
    );
  }

  const handleDelete = async (event) => {
    const confirmed = await confirm({
      title: "Delete event",
      message: `Delete "${event.title}"? Its attendance records go with it. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (confirmed) await deleteEvent(event.id);
  };

  return (
    <>
      <EventsBoard
        events={events}
        students={students}
        presentCounts={presentCounts}
        onCreate={() => setShowCreateModal(true)}
        onOpen={(event) => setSelectedEventId(event.id)}
        onDelete={handleDelete}
      />
      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} onCreated={(event) => setSelectedEventId(event.id)} />
      )}
    </>
  );
}
