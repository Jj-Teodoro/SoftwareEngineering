import { createContext, useContext, useEffect, useState } from "react";

const NotificationPrefContext = createContext(null);

function readStoredPref() {
  try {
    return localStorage.getItem("oasis-notif-badge") !== "off";
  } catch {
    return true;
  }
}

export function NotificationPrefProvider({ children }) {
  const [showBadge, setShowBadge] = useState(readStoredPref);

  useEffect(() => {
    try {
      localStorage.setItem("oasis-notif-badge", showBadge ? "on" : "off");
    } catch {
      // ignore
    }
  }, [showBadge]);

  const toggleShowBadge = () => setShowBadge((v) => !v);

  return (
    <NotificationPrefContext.Provider value={{ showBadge, toggleShowBadge }}>
      {children}
    </NotificationPrefContext.Provider>
  );
}

export function useNotificationPref() {
  const ctx = useContext(NotificationPrefContext);
  if (!ctx) {
    throw new Error("useNotificationPref must be used within a NotificationPrefProvider");
  }
  return ctx;
}
