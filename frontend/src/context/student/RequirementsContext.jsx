import { createContext, useContext, useState } from "react";
import { api } from "../../api/client.js";
import { usePolling } from "../../api/hooks.js";
import { toRequirement } from "../../api/mappers.js";
import { useStudent } from "./StudentContext";

const RequirementsContext = createContext(null);

export function RequirementsProvider({ children }) {
  const { student } = useStudent();
  const [items, setItems] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());

  // the server only returns this student's own completions
  usePolling(
    async () => {
      const [requirements, done] = await Promise.all([api.requirements.list(), api.requirements.completions()]);
      setItems(requirements.map(toRequirement));
      setCompletedIds(new Set(done.map((c) => c.requirement)));
    },
    { enabled: Boolean(student) }
  );

  const myItems = items.filter(
    (i) => !i.programFilter || i.programFilter === "ALL" || i.programFilter === student?.course
  );

  const isCompleted = (requirementId) => completedIds.has(requirementId);

  const completedPoints = myItems.reduce(
    (sum, i) => sum + (isCompleted(i.id) ? i.pointValue : 0),
    0
  );

  return (
    <RequirementsContext.Provider
      value={{ items: myItems, isCompleted, completedPoints }}
    >
      {children}
    </RequirementsContext.Provider>
  );
}

export function useRequirements() {
  const ctx = useContext(RequirementsContext);
  if (!ctx) {
    throw new Error("useRequirements must be used within a RequirementsProvider");
  }
  return ctx;
}
