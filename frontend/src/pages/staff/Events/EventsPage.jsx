import { useState } from "react";
import EventsBoard from "../../../components/common/EventsBoard.jsx";
import { useConfirm } from "../../../components/common/ConfirmDialog.jsx";
import { useEvents } from "../../../context/staff/EventsContext";
import { useStudents } from "../../../context/staff/StudentsContext";
import CreateEventModal from "../../../components/staff/CreateEventModal";
import EventDetailView from "./EventDetailView";
import { currentPortal } from "../../../api/portal";

export default function EventsPage({ onStartKiosk }) {
  const { events, presentCounts, deleteEvent } = useEvents();
  const { students } = useStudents();
  const confirm = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  // scanners create and delete events; admins can also open one to edit, notify and see the roster
  const canOpen = currentPortal() === "admin";

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
        onOpen={canOpen ? (event) => setSelectedEventId(event.id) : undefined}
        onDelete={handleDelete}
      />
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={canOpen ? (event) => setSelectedEventId(event.id) : undefined}
        />
      )}
    </>
  );
}
