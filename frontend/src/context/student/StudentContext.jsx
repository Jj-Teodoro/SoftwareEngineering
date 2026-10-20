import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useSignedIn, usePolling } from "../../api/hooks.js";
import { toStudent } from "../../api/mappers.js";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const signedIn = useSignedIn();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(signedIn);

  useEffect(() => {
    if (!signedIn) {
      setStudent(null);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [signedIn]);

  const refresh = usePolling(
    async () => {
      try {
        const user = await api.me();
        setStudent(user.role === "student" ? toStudent(user) : null);
      } finally {
        setLoading(false);
      }
    },
    { interval: 15000, enabled: signedIn }
  );

  // Students may only change their own photo, bio, talent and hobbies;
  // everything else on their record is managed by an admin.
  const updateProfile = async ({ bio, hobbies, talent, photo }) => {
    if (!student) return;
    await api.updateProfile({ bio, hobbies, talent, photo });
    await refresh();
  };

  // The server clears the temporary password when the new one is saved,
  // so all that is left is reloading the record.
  const completePasswordChange = async () => {
    if (!student) return;
    await refresh();
  };

  return (
    <StudentContext.Provider value={{ student, loading, updateProfile, completePasswordChange }}>
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
