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
  // only admins create, open (edit, notify, roster) and delete events; scanners just see them
  const isAdmin = currentPortal() === "admin";

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
        onCreate={isAdmin ? () => setShowCreateModal(true) : undefined}
        onOpen={isAdmin ? (event) => setSelectedEventId(event.id) : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
      />
      {isAdmin && showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(event) => setSelectedEventId(event.id)}
        />
      )}
    </>
  );
}
