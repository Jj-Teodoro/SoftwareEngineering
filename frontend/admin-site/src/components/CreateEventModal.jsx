import { useMemo } from "react";
import SharedCreateEventModal from "@oasis/shared/components/CreateEventModal.jsx";
import { useEvents } from "../context/EventsContext";
import { useStudents } from "../context/StudentsContext";

export default function CreateEventModal({ onClose, onCreated }) {
  const { createEvent } = useEvents();
  const { students } = useStudents();
  const programs = useMemo(
    () => [...new Set(students.map((s) => s.course).filter(Boolean))].sort(),
    [students]
  );

  return (
    <SharedCreateEventModal
      programs={programs}
      createEvent={createEvent}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
}
