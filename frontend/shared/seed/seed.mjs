// One-time seed script: creates the first admin auth account + seeds
// starter data (students, requirements, hobbies, settings, one sample event).
// Run with: node frontend/shared/seed/seed.mjs
// Requires Firestore rules to be temporarily permissive (see firestore.rules.seed-temp)
// while this runs, then switch to the real firestore.rules afterward.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  Timestamp,
} from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../.env");

function loadEnv(filePath) {
  const text = readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv(envPath);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_STUDENT_ID = "2024-02333";
const ADMIN_PASSWORD = "aces2024";
const ADMIN_EMAIL = `${ADMIN_STUDENT_ID}@oasis.local`;

const DEFAULT_STUDENTS = [
  {
    studentId: "2024-02333",
    name: "NIEVES, RAFAEL JOSEPH G.",
    course: "BS Computer Engineering",
    yearLevel: "3rd Year",
    section: "BSCPE-3A",
    status: "ACTIVE",
    email: "rafaeljoseph.nieves@dyci.edu.ph",
    contactNumber: "0917-123-4567",
    address: "Bocaue, Bulacan",
  },
  {
    studentId: "2024-00429",
    name: "OCAMPO, NATHAN LEO",
    course: "BS Computer Engineering",
    yearLevel: "3rd Year",
    section: "BSCPE-3A",
    status: "ACTIVE",
    email: "nathanleo.ocampo@dyci.edu.ph",
    contactNumber: "0917-234-5678",
    address: "Meycauayan, Bulacan",
  },
  {
    studentId: "2023-01187",
    name: "DELA CRUZ, MARIA SANTOS",
    course: "BS Computer Science",
    yearLevel: "4th Year",
    section: "BSCS-4A",
    status: "ACTIVE",
    email: "mariasantos.delacruz@dyci.edu.ph",
    contactNumber: "0918-345-6789",
    address: "Malolos, Bulacan",
  },
  {
    studentId: "2024-00981",
    name: "SANTOS, JOHN MICHAEL R.",
    course: "BS Information Technology",
    yearLevel: "2nd Year",
    section: "BSIT-2B",
    status: "INACTIVE",
    email: "johnmichael.santos@dyci.edu.ph",
    contactNumber: "0919-456-7890",
    address: "Marilao, Bulacan",
  },
  {
    studentId: "2022-00754",
    name: "REYES, ANGELA MARIE T.",
    course: "BS Computer Engineering",
    yearLevel: "4th Year",
    section: "BSCPE-4A",
    status: "ACTIVE",
    email: "angelamarie.reyes@dyci.edu.ph",
    contactNumber: "0920-567-8901",
    address: "Guiguinto, Bulacan",
  },
  {
    studentId: "2024-01652",
    name: "GARCIA, MARK ANTHONY V.",
    course: "BS Computer Science",
    yearLevel: "1st Year",
    section: "BSCS-1C",
    status: "INACTIVE",
    email: "markanthony.garcia@dyci.edu.ph",
    contactNumber: "0921-678-9012",
    address: "Balagtas, Bulacan",
  },
];

const DEFAULT_HOBBIES = [
  "Reading",
  "Gaming",
  "Coding",
  "Basketball",
  "Music",
  "Drawing",
  "Photography",
  "Dancing",
];

const DEFAULT_REQUIREMENTS = [
  { title: "Organizational Shirt", pointValue: 10 },
  { title: "Lanyard", pointValue: 10 },
  { title: "Booklet", pointValue: 10 },
];

async function ensureAdminAuthUser() {
  try {
    const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("Admin auth user already exists, signed in:", cred.user.uid);
    return cred.user.uid;
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log("Created admin auth user:", cred.user.uid);
      return cred.user.uid;
    }
    throw err;
  }
}

async function main() {
  const adminUid = await ensureAdminAuthUser();

  await setDoc(doc(db, "staff", adminUid), {
    name: "NIEVES, RAFAEL JOSEPH G.",
    studentId: ADMIN_STUDENT_ID,
    role: "admin",
  });
  console.log("Seeded staff/%s (role: admin)", adminUid);

  for (const student of DEFAULT_STUDENTS) {
    await setDoc(doc(db, "students", student.studentId), {
      ...student,
      bio: "",
      hobbies: [],
      talent: "",
      authUid: null,
    });
  }
  console.log("Seeded %d students", DEFAULT_STUDENTS.length);

  for (const hobby of DEFAULT_HOBBIES) {
    await setDoc(doc(collection(db, "hobbiesCatalog")), { label: hobby });
  }
  console.log("Seeded %d hobbies", DEFAULT_HOBBIES.length);

  for (const req of DEFAULT_REQUIREMENTS) {
    await setDoc(doc(collection(db, "requirements")), {
      title: req.title,
      pointValue: req.pointValue,
      programFilter: "ALL",
      createdAt: Timestamp.now(),
    });
  }
  console.log("Seeded %d requirements", DEFAULT_REQUIREMENTS.length);

  await setDoc(doc(db, "settings", "semester"), { targetPoints: 30 });
  console.log("Seeded settings/semester (targetPoints: 30)");

  const sampleEventRef = doc(collection(db, "events"));
  await setDoc(sampleEventRef, {
    title: "General Assembly",
    date: new Date().toISOString().slice(0, 10),
    description: "Sample seeded event",
    programFilter: "ALL",
    pointValue: 15,
    createdBy: adminUid,
    createdAt: Timestamp.now(),
  });
  console.log("Seeded sample event:", sampleEventRef.id);

  console.log("\nSeed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
