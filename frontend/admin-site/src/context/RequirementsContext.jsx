import { createContext, useContext, useState } from "react";
import { api } from "@oasis/shared/api/client.js";
import { useSignedIn, usePolling } from "@oasis/shared/api/hooks.js";
import { fromRequirement, toRequirement } from "@oasis/shared/api/mappers.js";

const RequirementsContext = createContext(null);

export function RequirementsProvider({ children }) {
  const signedIn = useSignedIn();
  const [items, setItems] = useState([]);
  const [completions, setCompletions] = useState({});

  const refresh = usePolling(
    async () => {
      const [requirements, done] = await Promise.all([api.requirements.list(), api.requirements.completions()]);
      setItems(requirements.map(toRequirement));
      const next = {};
      done.forEach(({ student, requirement }) => {
        if (!next[student]) next[student] = new Set();
        next[student].add(requirement);
      });
      setCompletions(next);
    },
    { enabled: signedIn }
  );

  const addItem = async ({ title, pointValue, programFilter }) => {
    const trimmed = title.trim();
    if (!trimmed) return { ok: false, message: "Requirement name is required." };
    if (items.some((i) => i.title.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, message: "This requirement already exists." };
    }
    try {
      await api.requirements.create(fromRequirement({ title: trimmed, pointValue, programFilter }));
    } catch (error) {
      return { ok: false, message: error.message };
    }
    await refresh();
    return { ok: true };
  };

  const updateItem = async (requirementId, { title, pointValue, programFilter }) => {
    const trimmed = (title || "").trim();
    if (!trimmed) return { ok: false, message: "Requirement name is required." };
    if (items.some((i) => i.id !== requirementId && i.title.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, message: "Another requirement already has this name." };
    }
    try {
      await api.requirements.update(requirementId, fromRequirement({ title: trimmed, pointValue, programFilter }));
    } catch (error) {
      return { ok: false, message: error.message };
    }
    await refresh();
    return { ok: true };
  };

  // Removing a requirement also removes every student's completion record for it.
  const deleteItem = async (requirementId) => {
    await api.requirements.remove(requirementId);
    await refresh();
  };

  const isCompleted = (studentId, requirementId) =>
    Boolean(completions[studentId]?.has(requirementId));

  const toggleCompleted = async (studentId, requirementId) => {
    await api.requirements.toggle(studentId, requirementId);
    await refresh();
  };

  // A requirement can be limited to one program; it only counts for students in it.
  const appliesTo = (item, course) =>
    !item.programFilter || item.programFilter === "ALL" || item.programFilter === course;

  const getRequirementPoints = (studentId, course) =>
    items.reduce(
      (sum, item) =>
        sum + (appliesTo(item, course) && isCompleted(studentId, item.id) ? item.pointValue : 0),
      0
    );

  return (
    <RequirementsContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        appliesTo,
        isCompleted,
        toggleCompleted,
        getRequirementPoints,
      }}
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
