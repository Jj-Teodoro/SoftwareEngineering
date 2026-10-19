import { useState } from "react";
import PointsBreakdownModal from "../components/PointsBreakdownModal";
import { useStudent } from "../context/StudentContext";
import ActivityCard from "./ActivityCard";
import RecentActivities from "./RecentActivities";
import RequirementsPanel from "./RequirementsPanel";

export default function ActivityPage() {
  const { student } = useStudent();
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!student) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
        <ActivityCard student={student} onShowBreakdown={() => setShowBreakdown(true)} />
        <RecentActivities onShowBreakdown={() => setShowBreakdown(true)} />
      </div>
      <RequirementsPanel />
      {showBreakdown && <PointsBreakdownModal onClose={() => setShowBreakdown(false)} />}
    </div>
  );
}
