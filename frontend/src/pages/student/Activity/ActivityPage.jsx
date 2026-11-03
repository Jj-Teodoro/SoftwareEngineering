import { useState } from "react";
import PointsBreakdownModal from "../../../components/student/PointsBreakdownModal";
import { useStudent } from "../../../context/student/StudentContext";
import ActivityCard from "./ActivityCard";
import RecentActivities from "./RecentActivities";
import RequirementsPanel from "./RequirementsPanel";
import StatTiles from "./StatTiles";
import UpNext from "./UpNext";
import WelcomeBanner from "./WelcomeBanner";

export default function ActivityPage() {
  const { student } = useStudent();
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!student) return null;

  return (
    <div className="flex flex-col gap-5">
      <WelcomeBanner student={student} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:items-start">
        <ActivityCard student={student} onShowBreakdown={() => setShowBreakdown(true)} />
        <div className="flex flex-col gap-5">
          <StatTiles />
          <UpNext />
          <RecentActivities />
        </div>
      </div>

      <RequirementsPanel />
      {showBreakdown && <PointsBreakdownModal onClose={() => setShowBreakdown(false)} />}
    </div>
  );
}
