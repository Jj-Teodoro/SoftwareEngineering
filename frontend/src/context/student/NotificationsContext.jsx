import { createContext, useContext, useState } from "react";
import { api } from "../../api/client.js";
import { usePolling } from "../../api/hooks.js";
import { toNotification } from "../../api/mappers.js";
import { useStudent } from "./StudentContext";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { student } = useStudent();
  const [notifications, setNotifications] = useState([]);

  // the server sends each student only the notifications addressed to them
  const refresh = usePolling(
    async () => {
      setNotifications((await api.notifications.list()).map(toNotification));
    },
    { enabled: Boolean(student) }
  );

  const isRead = (id) => Boolean(notifications.find((n) => n.id === id)?.read);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (notificationId) => {
    if (!student) return;
    setNotifications((list) => list.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    try {
      await api.notifications.markRead(notificationId);
    } finally {
      await refresh();
    }
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, isRead, unreadCount, markRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}
