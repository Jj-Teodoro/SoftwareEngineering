import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_REQUIREMENT_ITEMS } from "../data/requirementItems";

const ITEMS_KEY = "oasis_requirement_items";
const PAYMENTS_KEY = "oasis_requirement_payments";

const RequirementsContext = createContext(null);

function loadItems() {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return DEFAULT_REQUIREMENT_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REQUIREMENT_ITEMS;
  } catch {
    return DEFAULT_REQUIREMENT_ITEMS;
  }
}

function loadPayments() {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function RequirementsProvider({ children }) {
  const [items, setItems] = useState(loadItems);
  const [payments, setPayments] = useState(loadPayments);

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

  const addItem = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, message: "Item name is required." };
    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, message: "This requirement already exists." };
    }
    setItems((prev) => [...prev, trimmed]);
    return { ok: true };
  };

  const isPaid = (studentId, item) => Boolean(payments[studentId]?.[item]);

  const togglePaid = (studentId, item) => {
    setPayments((prev) => {
      const studentPayments = { ...(prev[studentId] || {}) };
      studentPayments[item] = !studentPayments[item];
      return { ...prev, [studentId]: studentPayments };
    });
  };

  const getStatus = (studentId) => {
    const paidCount = items.filter((item) => isPaid(studentId, item)).length;
    return {
      paidCount,
      totalCount: items.length,
      cleared: items.length > 0 && paidCount === items.length,
    };
  };

  return (
    <RequirementsContext.Provider
      value={{ items, addItem, isPaid, togglePaid, getStatus }}
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
