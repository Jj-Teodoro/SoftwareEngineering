import { createContext, useContext, useEffect, useState } from "react";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signOut as signOutAuth,
} from "firebase/auth";
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db, firebaseConfig } from "@oasis/shared/firebaseClient.js";
import {
  normalizeUsername,
  staffAliasId,
  staffKey,
  staffLoginEmail,
} from "@oasis/shared/utils/staffAuth.js";

const StaffContext = createContext(null);

const ACTIVE_WINDOW_MS = 90 * 1000;
const USERNAME_PATTERN = /^[a-z0-9._-]{4,24}$/;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// Firebase can only create a login from a browser session of its own, so a
// throwaway second app is used and the admin's session is left untouched.
async function withSecondaryAuth(run) {
  const app = initializeApp(firebaseConfig, `staff-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const secondaryAuth = getAuth(app);
  try {
    return await run(secondaryAuth);
  } finally {
    await signOutAuth(secondaryAuth).catch(() => {});
    await deleteApp(app).catch(() => {});
  }
}

export function StaffProvider({ children }) {
  const [staff, setStaff] = useState([]);
  const [presence, setPresence] = useState({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let unsubStaff = null;
    let unsubPresence = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      [unsubStaff, unsubPresence].forEach((u) => u && u());
      unsubStaff = unsubPresence = null;
      if (!user) {
        setStaff([]);
        setPresence({});
        return;
      }
      unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
        setStaff(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      });
      unsubPresence = onSnapshot(
        collection(db, "staffPresence"),
        (snap) => {
          const next = {};
          snap.forEach((d) => {
            const data = d.data();
            next[d.id] = { ...data, lastSeen: data.lastSeen?.toMillis?.() ?? null };
          });
          setPresence(next);
        },
        () => setPresence({})
      );
    });

    return () => {
      unsubscribeAuth();
      [unsubStaff, unsubPresence].forEach((u) => u && u());
    };
  }, []);

  /** Live status of one staff member: active, where, on what device, last seen. */
  const getActivity = (uid) => {
    const p = presence[uid];
    if (!p || !p.lastSeen) return { active: false, lastSeen: null };
    return { ...p, active: Boolean(p.online) && now - p.lastSeen < ACTIVE_WINDOW_MS };
  };

  const createScanner = async ({ name, username }) => {
    const id = normalizeUsername(username);
    const fullName = name.trim();
    if (!fullName) return { ok: false, message: "Enter the person's name." };
    if (!USERNAME_PATTERN.test(id)) {
      return { ok: false, message: "Username must be 4-24 letters, numbers, dots, dashes or underscores." };
    }
    if (staff.some((s) => normalizeUsername(s.username) === id)) {
      return { ok: false, message: "That username is already taken." };
    }

    const tempPassword = generateTempPassword();
    const loginEmail = staffLoginEmail(id);

    return withSecondaryAuth(async (secondaryAuth) => {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, loginEmail, tempPassword);
      } catch (e) {
        return {
          ok: false,
          message:
            e.code === "auth/email-already-in-use"
              ? "That username was used before. Pick a different one."
              : "Could not create the login.",
        };
      }

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, "staff", cred.user.uid), {
          username: id,
          name: fullName,
          role: "scanner",
          mustChangePassword: true,
          loginEmail,
          loginVersion: 1,
        });
        batch.set(doc(db, "accountCredentials", staffKey(id)), { tempPassword, createdAt: serverTimestamp() });
        await batch.commit();
      } catch {
        await deleteUser(cred.user).catch(() => {});
        return { ok: false, message: "Could not save the account. Nothing was created." };
      }
      return { ok: true, username: id, tempPassword };
    });
  };

  // For a forgotten or lost password: a fresh login with a new temporary
  // password. The old login stays in Firebase Authentication but is no longer
  // linked to a staff record, so it can't be used.
  const issuePassword = async (member) => {
    if (!member || member.role === "admin") return { ok: false, message: "Admin accounts can't be reset here." };
    if (member.uid === auth.currentUser?.uid) return { ok: false, message: "You can't reset your own account." };

    const id = normalizeUsername(member.username);
    const version = (member.loginVersion || 1) + 1;
    const loginEmail = staffLoginEmail(id, version);
    const tempPassword = generateTempPassword();

    return withSecondaryAuth(async (secondaryAuth) => {
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, loginEmail, tempPassword);
      } catch {
        return { ok: false, message: "Could not create the new login." };
      }

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, "staff", cred.user.uid), {
          username: id,
          name: member.name,
          role: member.role,
          mustChangePassword: true,
          loginEmail,
          loginVersion: version,
        });
        batch.set(doc(db, "accountCredentials", staffKey(id)), { tempPassword, createdAt: serverTimestamp() });
        batch.set(doc(db, "loginAliases", await staffAliasId(id)), { authEmail: loginEmail });
        batch.delete(doc(db, "staff", member.uid));
        batch.delete(doc(db, "staffPresence", member.uid));
        batch.delete(doc(db, "passwordRequests", staffKey(id)));
        await batch.commit();
      } catch {
        await deleteUser(cred.user).catch(() => {});
        return { ok: false, message: "Could not save the new login. Nothing was changed." };
      }
      return { ok: true, username: id, tempPassword };
    });
  };

  const removeStaff = async (member) => {
    if (!member || member.uid === auth.currentUser?.uid) return { ok: false, message: "You can't remove yourself." };
    const id = normalizeUsername(member.username);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "staff", member.uid));
      batch.delete(doc(db, "staffPresence", member.uid));
      batch.delete(doc(db, "accountCredentials", staffKey(id)));
      batch.delete(doc(db, "passwordRequests", staffKey(id)));
      batch.delete(doc(db, "loginAliases", await staffAliasId(id)));
      await batch.commit();
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not remove the account." };
    }
  };

  return (
    <StaffContext.Provider value={{ staff, getActivity, now, createScanner, issuePassword, removeStaff }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return ctx;
}
