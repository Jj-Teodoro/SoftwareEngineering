import ScanPicker from "../../../components/common/ScanPicker.jsx";
import { useEvents } from "../../../context/staff/EventsContext";
import { useStudents } from "../../../context/staff/StudentsContext";
import { currentPortal } from "../../../api/portal";

export default function ScanPage({ onStartKiosk }) {
  const { events, presentCounts } = useEvents();
  const { students } = useStudents();
  return (
    <ScanPicker
      events={events}
      students={students}
      presentCounts={presentCounts}
      onStartKiosk={onStartKiosk}
      exitPassword={currentPortal() === "admin" ? "admin" : "staff"}
    />
  );
}
