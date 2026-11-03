import { createContext, useContext, useState } from "react";
import { api } from "../../api/client.js";
import { usePolling, useSignedIn } from "../../api/hooks.js";
import { useRequirements } from "./RequirementsContext";
import { useEvents } from "./EventsContext";

const PointsContext = createContext(null);

export function PointsProvider({ children }) {
  const { items, completedPoints } = useRequirements();
  const { events, myAttendance } = useEvents();
  const signedIn = useSignedIn();
  const [requiredPoints, setRequiredPoints] = useState(null); // null = automatic

  usePolling(
    async () => {
      const setting = await api.settings.clearance();
      setRequiredPoints(setting.required_points ?? null);
    },
    { enabled: signedIn, interval: 60000 }
  );

  const eventPoints = Object.values(myAttendance).reduce(
    (sum, record) => sum + (record.pointValue || 0),
    0
  );
  const totalPoints = completedPoints + eventPoints;

  // Everything that applies to this student's program (both lists are already filtered).
  const sum = (list) => list.reduce((total, x) => total + (x.pointValue || 0), 0);
  // an admin-set target replaces the automatic one; earning more than it is fine
  const targetPoints = requiredPoints || sum(items) + sum(events);
  const cleared = targetPoints > 0 && totalPoints >= targetPoints;
  const extraPoints = Math.max(0, totalPoints - targetPoints);
  const pct = targetPoints > 0 ? Math.min(100, Math.round((totalPoints / targetPoints) * 100)) : 0;

  return (
    <PointsContext.Provider value={{ totalPoints, targetPoints, cleared, pct, extraPoints }}>
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
