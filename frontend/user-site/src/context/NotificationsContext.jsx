import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";
import { useStudent } from "./StudentContext";

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { student } = useStudent();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      if (!user) {
        setNotifications([]);
        return;
      }
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  useEffect(() => {
    if (!student) {
      setReadIds(new Set());
      return;
    }
    const q = collection(db, "students", student.studentId, "notificationReads");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReadIds(new Set(snapshot.docs.map((d) => d.id)));
    });
    return unsubscribe;
  }, [student?.studentId]);

  const myNotifications = notifications.filter(
    (n) => !n.targetProgram || n.targetProgram === "ALL" || n.targetProgram === student?.course
  );

  const isRead = (id) => readIds.has(id);
  const unreadCount = myNotifications.filter((n) => !isRead(n.id)).length;

  const markRead = async (notificationId) => {
    if (!student) return;
    await setDoc(doc(db, "students", student.studentId, "notificationReads", notificationId), {
      readAt: new Date().toISOString(),
    });
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications: myNotifications, isRead, unreadCount, markRead }}
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
