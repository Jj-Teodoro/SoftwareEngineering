import { createContext, useContext } from "react";
import { useRequirements } from "./RequirementsContext";
import { useEvents } from "./EventsContext";

const PointsContext = createContext(null);

export function PointsProvider({ children }) {
  const { completedPoints, targetPoints } = useRequirements();
  const { myAttendance } = useEvents();

  const eventPoints = Object.values(myAttendance).reduce(
    (sum, record) => sum + (record.pointValue || 0),
    0
  );
  const totalPoints = completedPoints + eventPoints;
  const cleared = targetPoints > 0 && totalPoints >= targetPoints;
  const pct = targetPoints > 0 ? Math.min(100, Math.round((totalPoints / targetPoints) * 100)) : 0;

  return (
    <PointsContext.Provider value={{ totalPoints, targetPoints, cleared, pct }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return ctx;
}
