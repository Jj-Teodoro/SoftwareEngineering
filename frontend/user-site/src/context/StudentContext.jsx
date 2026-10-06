import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@oasis/shared/firebaseClient.js";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (!user) {
        setStudent(null);
        setLoading(false);
        return;
      }
      const q = query(collection(db, "students"), where("authUid", "==", user.uid));
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setStudent(null);
        } else {
          const d = snapshot.docs[0];
          setStudent({ studentId: d.id, ...d.data() });
        }
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const updateProfile = async ({ bio, hobbies, talent }) => {
    if (!student) return;
    await updateDoc(doc(db, "students", student.studentId), { bio, hobbies, talent });
  };

  return (
    <StudentContext.Provider value={{ student, loading, updateProfile }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return ctx;
}
