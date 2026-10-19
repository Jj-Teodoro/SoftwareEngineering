import ScanPicker from "@oasis/shared/components/ScanPicker.jsx";
import { useEvents } from "../context/EventsContext";
import { useStudents } from "../context/StudentsContext";

export default function ScanPage({ onStartKiosk }) {
  const { events, presentCounts } = useEvents();
  const { students } = useStudents();
  return (
    <ScanPicker
      events={events}
      students={students}
      presentCounts={presentCounts}
      onStartKiosk={onStartKiosk}
      exitPassword="admin"
    />
  );
}
