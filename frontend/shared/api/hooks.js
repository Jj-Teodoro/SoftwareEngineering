import { useCallback, useEffect, useRef, useState } from "react";
import { hasSession, subscribeSession } from "./client.js";

// true while this site has a signed-in session (replaces onAuthStateChanged)
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(hasSession);
  useEffect(() => subscribeSession(setSignedIn), []);
  return signedIn;
}

/**
 * Keeps data fresh the way Firestore listeners did: loads right away, then every
 * `interval` ms while the tab is visible, and again when the tab regains focus.
 * Returns a `refresh` function to call after a change so it shows up immediately.
 */
export function usePolling(load, { interval = 10000, enabled = true } = {}) {
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    try {
      await loadRef.current();
    } catch {
      // keep showing the last good data; the next tick retries
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, interval);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, interval, refresh]);

  return refresh;
}
