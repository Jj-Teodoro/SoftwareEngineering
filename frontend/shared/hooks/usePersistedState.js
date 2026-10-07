import { useEffect, useState } from "react";

/**
 * useState that survives a page reload (kept per browser tab in sessionStorage),
 * so a refresh leaves you on the same page instead of resetting to the first one.
 */
export default function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored === null ? initial : JSON.parse(stored);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode); the app still works, it just won't remember
    }
  }, [key, value]);

  return [value, setValue];
}
