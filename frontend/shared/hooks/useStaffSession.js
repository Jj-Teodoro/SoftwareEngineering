import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseClient.js";

/**
 * Keeps staff signed in across page reloads. Firebase remembers the login; this
 * looks up the matching staff record and hands back the same `user` object the
 * sign-in form produces. Pass { adminOnly: true } on the admin site so a scanner
 * account is signed straight back out.
 */
export default function useStaffSession({ adminOnly = false } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        try {
          const snap = await getDoc(doc(db, "staff", firebaseUser.uid));
          const staff = snap.exists() ? snap.data() : null;
          if (!staff || (adminOnly && staff.role !== "admin")) {
            // a student, or a scanner on the admin site: not allowed here
            if (staff || !snap.exists()) await signOut(auth).catch(() => {});
            setUser(null);
          } else {
            setUser({
              uid: firebaseUser.uid,
              username: staff.username,
              name: staff.name,
              role: staff.role,
              mustChangePassword: Boolean(staff.mustChangePassword),
            });
          }
        } catch {
          setUser(null);
        }
        setLoading(false);
      }),
    [adminOnly]
  );

  return { user, setUser, loading };
}
