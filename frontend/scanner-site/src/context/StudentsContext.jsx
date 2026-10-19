import { createContext, useContext, useState } from "react";
import { api } from "@oasis/shared/api/client.js";
import { useSignedIn, usePolling } from "@oasis/shared/api/hooks.js";
import { toStudent } from "@oasis/shared/api/mappers.js";

const StudentsContext = createContext(null);

export function StudentsProvider({ children }) {
  const signedIn = useSignedIn();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  usePolling(
    async () => {
      const users = await api.users.list({ role: "student" });
      setStudents(users.map(toStudent));
      setLoading(false);
    },
    { enabled: signedIn }
  );

  return (
    <StudentsContext.Provider value={{ students, loading }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) {
    throw new Error("useStudents must be used within a StudentsProvider");
  }
  return ctx;
}
