import { useMemo } from "react";
import SharedCreateEventModal from "../common/CreateEventModal.jsx";
import { useEvents } from "../../context/staff/EventsContext";
import { useStudents } from "../../context/staff/StudentsContext";

export default function CreateEventModal({ event, onClose, onCreated }) {
  const { createEvent, updateEvent } = useEvents();
  const { students } = useStudents();
  const programs = useMemo(
    () => [...new Set(students.map((s) => s.course).filter(Boolean))].sort(),
    [students]
  );

  return (
    <SharedCreateEventModal
      programs={programs}
      createEvent={createEvent}
      updateEvent={updateEvent}
      event={event}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}
